import type { FastifyInstance } from "fastify";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { TEST_CARDS } from "../payments/simulated-payment-gateway.ts";
import { buildTestApp, TEST_ORDERS, type TestApp } from "../testing/build-test-app.ts";
import {
  bearerFor,
  createProduct,
  createVendor,
  placeOrder,
  post,
  userData,
  type Headers,
} from "../testing/order-fixtures.ts";

const MINUTES_PER_DAY = 24 * 60;

describe("order scheduler jobs", () => {
  let app: FastifyInstance;
  let test: TestApp;
  let owner: Headers;
  let buyer: Headers;
  let lamp: string;

  beforeEach(async () => {
    await app?.close();
    test = await buildTestApp();
    app = test.app;
    owner = await bearerFor(app, userData("owner@example.com"));
    buyer = await bearerFor(app, userData("buyer@example.com"));
    lamp = await createProduct(app, owner, await createVendor(app, owner, "acme"), { stock: 50 });
  });

  afterAll(async () => {
    await app.close();
  });

  const stock = () => test.productsRepository.rows.find((row) => row.id === lamp)?.stock;
  const statusOf = (id: string) => test.ordersRepository.rows.find((row) => row.id === id)?.status;

  async function order(quantity = 1): Promise<string> {
    return (await placeOrder(app, buyer, [{ productId: lamp, quantity }])).json().data[0].id;
  }

  async function deliveredOrder(): Promise<string> {
    const id = await order();

    await post(app, buyer, `/api/v1/orders/${id}/payments`, { cardNumber: TEST_CARDS.success });
    await post(app, owner, `/api/v1/orders/${id}/deliver`);

    return id;
  }

  it("cancels stale unpaid orders and restores their stock", async () => {
    const stale = await order(3);

    test.clock.advanceMinutes(TEST_ORDERS.paymentTtlMinutes - 1);
    const fresh = await order(2);
    const paid = await order();

    await post(app, buyer, `/api/v1/orders/${paid}/payments`, { cardNumber: TEST_CARDS.success });
    test.clock.advanceMinutes(2);

    const result = await test.ordersService.expireUnpaid();

    expect(result).toEqual({ processed: 1, failures: [] });
    expect(statusOf(stale)).toBe("cancelled");
    expect(statusOf(fresh)).toBe("created");
    expect(statusOf(paid)).toBe("paid");
    expect(stock()).toBe(50 - 2 - 1);

    const events = test.ordersRepository.rows.find((row) => row.id === stale)?.events;

    expect(events?.at(-1)).toMatchObject({
      fromStatus: "created",
      toStatus: "cancelled",
      actor: "system",
    });
  });

  it("closes delivered orders after the return window", async () => {
    const old = await deliveredOrder();

    test.clock.advanceMinutes(MINUTES_PER_DAY);
    const recent = await deliveredOrder();

    test.clock.advanceMinutes((TEST_ORDERS.returnWindowDays - 1) * MINUTES_PER_DAY + 1);

    expect(await test.ordersService.closeElapsed()).toEqual({ processed: 1, failures: [] });
    expect(statusOf(old)).toBe("closed");
    expect(statusOf(recent)).toBe("delivered");
    expect(test.ordersRepository.rows.find((row) => row.id === old)?.closedAt).not.toBeNull();
  });

  it("respects the batch size", async () => {
    for (let index = 0; index < TEST_ORDERS.schedulerBatchSize + 2; index += 1) {
      await order();
    }

    test.clock.advanceMinutes(TEST_ORDERS.paymentTtlMinutes + 1);

    expect((await test.ordersService.expireUnpaid()).processed).toBe(
      TEST_ORDERS.schedulerBatchSize,
    );
    expect((await test.ordersService.expireUnpaid()).processed).toBe(2);
  });

  it("goes on after one order fails", async () => {
    const broken = await order();
    const healthy = await order();

    test.ordersRepository.failingIds.add(broken);
    test.clock.advanceMinutes(TEST_ORDERS.paymentTtlMinutes + 1);

    const result = await test.ordersService.expireUnpaid();

    expect(result.processed).toBe(1);
    expect(result.failures.map((failure) => failure.orderId)).toEqual([broken]);
    expect(statusOf(healthy)).toBe("cancelled");
    expect(statusOf(broken)).toBe("created");
  });

  it("changes nothing on a second run", async () => {
    await order();
    test.clock.advanceMinutes(TEST_ORDERS.paymentTtlMinutes + 1);

    await test.ordersService.expireUnpaid();
    const stockAfterFirst = stock();

    expect(await test.ordersService.expireUnpaid()).toEqual({ processed: 0, failures: [] });
    expect(stock()).toBe(stockAfterFirst);
  });
});
