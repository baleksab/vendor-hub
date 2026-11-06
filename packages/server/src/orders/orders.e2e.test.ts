import { eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../app.ts";
import { CartService } from "../cart/cart.service.ts";
import type { DatabaseHandle } from "../db/client.ts";
import { orderEvents, orders, products } from "../db/schema.ts";
import { TEST_CARDS, SimulatedPaymentGateway } from "../payments/simulated-payment-gateway.ts";
import { DrizzleProductsRepository } from "../products/products.repository.ts";
import { TEST_CART, TEST_ORDERS } from "../testing/build-test-app.ts";
import { drizzleAppOptions } from "../testing/drizzle-app-options.ts";
import {
  bearerFor,
  createProduct,
  createVendor,
  placeOrder,
  post,
  shipping,
  userData,
  type Headers,
} from "../testing/order-fixtures.ts";
import { createTestDatabase, truncateAll } from "../testing/test-database.ts";
import { DrizzleVendorsRepository } from "../vendors/vendors.repository.ts";
import { DrizzleOrdersRepository } from "./orders.repository.ts";
import { OrdersService } from "./orders.service.ts";

const STALE_ORDERS = 8;

describe("orders against Postgres", () => {
  let handle: DatabaseHandle;
  let app: FastifyInstance;
  let owner: Headers;
  let buyer: Headers;
  let vendorId: string;

  beforeAll(async () => {
    handle = await createTestDatabase();
    app = await buildApp(drizzleAppOptions(handle));
    await app.ready();
  });

  beforeEach(async () => {
    await truncateAll(handle);
    owner = await bearerFor(app, userData("owner@example.com"));
    buyer = await bearerFor(app, userData("buyer@example.com"));
    vendorId = await createVendor(app, owner, "acme");
  });

  afterAll(async () => {
    await app.close();
    await handle.pool.end().catch(() => undefined);
  });

  async function stockOf(productId: string): Promise<number | undefined> {
    const [row] = await handle.db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, productId));

    return row?.stock;
  }

  function service(): OrdersService {
    const productsRepository = new DrizzleProductsRepository(handle.db);

    return new OrdersService(
      new DrizzleOrdersRepository(handle.db),
      new DrizzleVendorsRepository(handle.db),
      new CartService(productsRepository, TEST_CART),
      new SimulatedPaymentGateway(),
      TEST_ORDERS,
      () => new Date(),
    );
  }

  it("sells the last item only once under concurrent orders", async () => {
    const productId = await createProduct(app, owner, vendorId, { stock: 1 });
    const other = await bearerFor(app, userData("other@example.com"));

    const responses = await Promise.all([
      placeOrder(app, buyer, [{ productId, quantity: 1 }]),
      placeOrder(app, other, [{ productId, quantity: 1 }]),
    ]);

    expect(responses.map((response) => response.statusCode).sort((a, b) => a - b)).toEqual([
      201, 409,
    ]);
    expect(await stockOf(productId)).toBe(0);
  });

  it("creates one set of orders for concurrent requests with the same key", async () => {
    const productId = await createProduct(app, owner, vendorId, { stock: 10 });
    const key = crypto.randomUUID();

    const responses = await Promise.all([
      placeOrder(app, buyer, [{ productId, quantity: 1 }], key),
      placeOrder(app, buyer, [{ productId, quantity: 1 }], key),
    ]);

    expect(responses.every((response) => response.statusCode < 300)).toBe(true);
    expect(responses[0]?.json().data[0].id).toBe(responses[1]?.json().data[0].id);
    expect(await handle.db.$count(orders)).toBe(1);
    expect(await stockOf(productId)).toBe(9);
  });

  it("rolls back stock and orders when one line runs out", async () => {
    const first = await createProduct(app, owner, vendorId, { stock: 5 });
    const second = await createProduct(app, owner, vendorId, { stock: 1 });
    const repository = new DrizzleOrdersRepository(handle.db);
    const [user] = await handle.db
      .execute<{ id: string }>(sql`select id from users where email = 'buyer@example.com'`)
      .then((result) => result.rows);

    const result = await repository.createOrders({
      userId: user!.id,
      idempotencyKey: crypto.randomUUID(),
      shipping,
      orders: [
        {
          vendorId,
          currency: "EUR",
          totalMinor: 0,
          items: [
            { productId: first, name: "First", unitPriceMinor: 0, quantity: 2 },
            { productId: second, name: "Second", unitPriceMinor: 0, quantity: 2 },
          ],
        },
      ],
    });

    expect(result).toEqual({ kind: "outOfStock" });
    expect(await stockOf(first)).toBe(5);
    expect(await stockOf(second)).toBe(1);
    expect(await handle.db.$count(orders)).toBe(0);
  });

  it("runs the whole flow: pay, deliver, return and refund", async () => {
    const productId = await createProduct(app, owner, vendorId, { stock: 3, priceMinor: 700 });
    const id = (await placeOrder(app, buyer, [{ productId, quantity: 2 }])).json().data[0].id;

    const declined = await post(app, buyer, `/api/v1/orders/${id}/payments`, {
      cardNumber: TEST_CARDS.declined,
    });

    expect(declined.json().order.status).toBe("created");

    await post(app, buyer, `/api/v1/orders/${id}/payments`, { cardNumber: TEST_CARDS.success });
    await post(app, owner, `/api/v1/orders/${id}/deliver`);
    await post(app, buyer, `/api/v1/orders/${id}/return-requests`, { reason: "Broken" });

    const approved = await post(app, owner, `/api/v1/orders/${id}/returns/approve`);

    expect(approved.json()).toMatchObject({
      status: "return_approved",
      paymentAttempts: 1,
      items: [{ quantity: 2, unitPriceMinor: 700 }],
    });
    expect(
      approved
        .json()
        .payments.map((payment: { kind: string; status: string }) => [
          payment.kind,
          payment.status,
        ]),
    ).toEqual([
      ["charge", "failed"],
      ["charge", "succeeded"],
      ["refund", "succeeded"],
    ]);
    expect(approved.json().events.map((event: { toStatus: string }) => event.toStatus)).toEqual([
      "created",
      "created",
      "paid",
      "delivered",
      "return_requested",
      "return_approved",
    ]);
    expect(await stockOf(productId)).toBe(3);

    const list = await app.inject({
      method: "GET",
      url: `/api/v1/vendors/${vendorId}/orders?status=return_approved`,
      headers: owner,
    });

    expect(list.json().data).toMatchObject([{ id, itemCount: 2, buyerName: "Bora Buyer" }]);
  });

  it("expires stale orders once across two concurrent schedulers", async () => {
    const productId = await createProduct(app, owner, vendorId, { stock: 100 });

    for (let index = 0; index < STALE_ORDERS; index += 1) {
      await placeOrder(app, buyer, [{ productId, quantity: 1 }]);
    }

    await handle.db
      .update(orders)
      .set({ createdAt: sql`now() - interval '1 day'` })
      .where(eq(orders.status, "created"));

    const [left, right] = await Promise.all([service().expireUnpaid(), service().expireUnpaid()]);

    expect(left.failures).toEqual([]);
    expect(right.failures).toEqual([]);
    expect(left.processed + right.processed).toBe(STALE_ORDERS);
    expect(await stockOf(productId)).toBe(100);

    const cancelEvents = await handle.db.$count(orderEvents, eq(orderEvents.toStatus, "cancelled"));

    expect(cancelEvents).toBe(STALE_ORDERS);
  });

  it("closes delivered orders after the return window", async () => {
    const productId = await createProduct(app, owner, vendorId);
    const id = (await placeOrder(app, buyer, [{ productId, quantity: 1 }])).json().data[0].id;

    await post(app, buyer, `/api/v1/orders/${id}/payments`, { cardNumber: TEST_CARDS.success });
    await post(app, owner, `/api/v1/orders/${id}/deliver`);
    await handle.db
      .update(orders)
      .set({ deliveredAt: sql`now() - interval '30 days'` })
      .where(eq(orders.id, id));

    expect((await service().closeElapsed()).processed).toBe(1);

    const [row] = await handle.db.select().from(orders).where(eq(orders.id, id));

    expect(row?.status).toBe("closed");
    expect(row?.closedAt).not.toBeNull();
  });
});
