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
  shipping,
  userData,
  type Headers,
} from "../testing/order-fixtures.ts";

const unknownId = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";
const MINUTES_PER_DAY = 24 * 60;

describe("orders", () => {
  let app: FastifyInstance;
  let test: TestApp;
  let owner: Headers;
  let operator: Headers;
  let buyer: Headers;
  let stranger: Headers;
  let vendorId: string;
  let lamp: string;

  beforeEach(async () => {
    await app?.close();
    test = await buildTestApp();
    app = test.app;
    owner = await bearerFor(app, userData("owner@example.com", "Olga"));
    operator = await bearerFor(app, userData("op@example.com", "Oscar"));
    buyer = await bearerFor(app, userData("buyer@example.com", "Bora"));
    stranger = await bearerFor(app, userData("stranger@example.com", "Sara"));
    vendorId = await createVendor(app, owner, "acme");
    await post(app, owner, "/api/v1/vendors/me/operators", { email: "op@example.com" });
    lamp = await createProduct(app, owner, vendorId, { priceMinor: 1500, stock: 5 });
  });

  afterAll(async () => {
    await app.close();
  });

  const stockOf = (productId: string) =>
    test.productsRepository.rows.find((row) => row.id === productId)?.stock;

  async function orderId(lines = [{ productId: lamp, quantity: 1 }]): Promise<string> {
    const response = await placeOrder(app, buyer, lines);

    return response.json().data[0].id;
  }

  const getOrder = (headers: Headers, id: string) =>
    app.inject({ method: "GET", url: `/api/v1/orders/${id}`, headers });

  const pay = (id: string, cardNumber: string = TEST_CARDS.success, headers = buyer) =>
    post(app, headers, `/api/v1/orders/${id}/payments`, { cardNumber });

  async function delivered(): Promise<string> {
    const id = await orderId();

    await pay(id);
    await post(app, owner, `/api/v1/orders/${id}/deliver`);

    return id;
  }

  describe("creation", () => {
    it("splits the cart by vendor and currency and decrements stock", async () => {
      const otherOwner = await bearerFor(app, userData("other@example.com"));
      const otherVendor = await createVendor(app, otherOwner, "globex");
      const rsdLamp = await createProduct(app, owner, vendorId, {
        priceMinor: 900,
        currency: "RSD",
      });
      const chair = await createProduct(app, otherOwner, otherVendor, { priceMinor: 4000 });

      const response = await placeOrder(app, buyer, [
        { productId: lamp, quantity: 2 },
        { productId: rsdLamp, quantity: 1 },
        { productId: chair, quantity: 1 },
      ]);

      expect(response.statusCode).toBe(201);

      const orders = response.json().data as {
        vendorSlug: string;
        currency: string;
        totalMinor: number;
      }[];

      expect(
        orders.map(({ vendorSlug, currency, totalMinor }) => ({
          vendorSlug,
          currency,
          totalMinor,
        })),
      ).toEqual([
        { vendorSlug: "acme", currency: "EUR", totalMinor: 3000 },
        { vendorSlug: "acme", currency: "RSD", totalMinor: 900 },
        { vendorSlug: "globex", currency: "EUR", totalMinor: 4000 },
      ]);
      expect(stockOf(lamp)).toBe(3);
    });

    it("snapshots the items and the shipping details", async () => {
      const id = await orderId([{ productId: lamp, quantity: 2 }]);

      await app.inject({
        method: "PATCH",
        url: `/api/v1/products/${lamp}`,
        headers: owner,
        payload: { name: "Renamed", priceMinor: 1 },
      });

      const order = (await getOrder(buyer, id)).json();

      expect(order).toMatchObject({
        status: "created",
        items: [{ name: "Lamp", unitPriceMinor: 1500, quantity: 2, lineTotalMinor: 3000 }],
        shipping,
        buyerName: "Bora Buyer",
        allowedActions: ["pay", "cancel"],
        events: [{ fromStatus: null, toStatus: "created", actor: "buyer" }],
      });
    });

    it("answers 409 with a fresh quote and creates nothing when a line is not ok", async () => {
      const response = await placeOrder(app, buyer, [{ productId: lamp, quantity: 6 }]);

      expect(response.statusCode).toBe(409);
      expect(response.json().quote.lines[0]).toMatchObject({
        status: "quantityReduced",
        quantity: 5,
      });
      expect(test.ordersRepository.rows).toHaveLength(0);
      expect(stockOf(lamp)).toBe(5);
    });

    it("returns the same orders for a repeated idempotency key", async () => {
      const key = crypto.randomUUID();
      const first = await placeOrder(app, buyer, [{ productId: lamp, quantity: 1 }], key);
      const second = await placeOrder(app, buyer, [{ productId: lamp, quantity: 1 }], key);

      expect(second.statusCode).toBe(200);
      expect(second.json().data).toEqual(first.json().data);
      expect(test.ordersRepository.rows).toHaveLength(1);
      expect(stockOf(lamp)).toBe(4);
    });

    it("does not share idempotency keys between users", async () => {
      const key = crypto.randomUUID();
      const mine = await placeOrder(app, buyer, [{ productId: lamp, quantity: 1 }], key);
      const theirs = await placeOrder(app, stranger, [{ productId: lamp, quantity: 1 }], key);

      expect(theirs.statusCode).toBe(201);
      expect(theirs.json().data[0].id).not.toBe(mine.json().data[0].id);
    });

    it("validates the shipping details", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/orders",
        headers: buyer,
        payload: {
          lines: [{ productId: lamp, quantity: 1 }],
          shipping: { ...shipping, phoneNumber: "0601234567", country: "XX" },
          idempotencyKey: crypto.randomUUID(),
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().errors.map((error: { path: string }) => error.path)).toEqual(
        expect.arrayContaining(["shipping.phoneNumber", "shipping.country"]),
      );
    });

    it("lists only the caller's orders, newest first, filtered by status", async () => {
      const first = await orderId();

      test.clock.advanceMinutes(1);
      const second = await orderId();

      await placeOrder(app, stranger, [{ productId: lamp, quantity: 1 }]);
      await pay(second);

      const all = (
        await app.inject({ method: "GET", url: "/api/v1/orders", headers: buyer })
      ).json();

      expect(all.data.map((order: { id: string }) => order.id)).toEqual([second, first]);
      expect(all.meta.total).toBe(2);

      const paid = (
        await app.inject({ method: "GET", url: "/api/v1/orders?status=paid", headers: buyer })
      ).json();

      expect(paid.data.map((order: { id: string }) => order.id)).toEqual([second]);
    });
  });

  describe("payment", () => {
    it("pays with the success card", async () => {
      const id = await orderId();
      const response = await pay(id, "4242 4242 4242 4242");

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        order: { status: "paid", allowedActions: [] },
        payment: { status: "succeeded", failureReason: null },
      });
    });

    it("keeps the order created after a declined card and counts the attempt", async () => {
      const id = await orderId();
      const body = (await pay(id, TEST_CARDS.declined)).json();

      expect(body.payment).toEqual({
        status: "failed",
        failureReason: "declined",
        attemptsLeft: TEST_ORDERS.paymentMaxAttempts - 1,
      });
      expect(body.order).toMatchObject({ status: "created", paymentAttempts: 1 });
      expect(body.order.payments).toHaveLength(1);
    });

    it("cancels the order and restores stock when the attempts are used up", async () => {
      const id = await orderId([{ productId: lamp, quantity: 2 }]);

      for (let attempt = 0; attempt < TEST_ORDERS.paymentMaxAttempts; attempt += 1) {
        await pay(id, TEST_CARDS.declined);
      }

      const order = (await getOrder(buyer, id)).json();

      expect(order.status).toBe("cancelled");
      expect(order.events.at(-1)).toMatchObject({ toStatus: "cancelled", actor: "system" });
      expect(stockOf(lamp)).toBe(5);
    });

    it("never stores or returns card data", async () => {
      const id = await orderId();
      const response = await pay(id, TEST_CARDS.declined);

      expect(response.body).not.toContain(TEST_CARDS.declined);
      expect(JSON.stringify(test.ordersRepository.rows)).not.toMatch(/4000|0002|card/i);
    });

    it("refuses a second payment", async () => {
      const id = await orderId();

      await pay(id);

      expect((await pay(id)).statusCode).toBe(409);
    });

    it("refuses a payment after the TTL even before the scheduler runs", async () => {
      const id = await orderId();

      test.clock.advanceMinutes(TEST_ORDERS.paymentTtlMinutes);

      expect((await pay(id)).statusCode).toBe(409);
      expect((await getOrder(buyer, id)).json().status).toBe("created");
    });

    it("rejects an invalid card number", async () => {
      const id = await orderId();

      expect((await pay(id, "12ab")).statusCode).toBe(400);
    });
  });

  describe("buyer actions", () => {
    it("cancels an unpaid order and restores stock", async () => {
      const id = await orderId([{ productId: lamp, quantity: 3 }]);
      const response = await post(app, buyer, `/api/v1/orders/${id}/cancel`);

      expect(response.json().status).toBe("cancelled");
      expect(stockOf(lamp)).toBe(5);
    });

    it("cannot cancel a paid order", async () => {
      const id = await orderId();

      await pay(id);

      expect((await post(app, buyer, `/api/v1/orders/${id}/cancel`)).statusCode).toBe(409);
    });

    it("confirms receipt of a delivered order", async () => {
      const id = await delivered();
      const response = await post(app, buyer, `/api/v1/orders/${id}/confirm-receipt`);

      expect(response.json()).toMatchObject({ status: "closed" });
    });

    it("requests a return with a reason inside the window", async () => {
      const id = await delivered();
      const empty = await post(app, buyer, `/api/v1/orders/${id}/return-requests`, { reason: " " });
      const response = await post(app, buyer, `/api/v1/orders/${id}/return-requests`, {
        reason: "Broken on arrival",
      });

      expect(empty.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        status: "return_requested",
        allowedActions: [],
      });
      expect(response.json().events.at(-1).note).toBe("Broken on arrival");
    });

    it("refuses a return after the window even before the scheduler runs", async () => {
      const id = await delivered();

      test.clock.advanceMinutes(TEST_ORDERS.returnWindowDays * MINUTES_PER_DAY);

      const response = await post(app, buyer, `/api/v1/orders/${id}/return-requests`, {
        reason: "Too late",
      });

      expect(response.statusCode).toBe(409);
    });

    it("refuses buyer actions to vendor members", async () => {
      const id = await orderId();

      expect((await post(app, owner, `/api/v1/orders/${id}/cancel`)).statusCode).toBe(404);
      expect((await pay(id, TEST_CARDS.success, owner)).statusCode).toBe(404);
    });
  });

  describe("fulfilment", () => {
    it("lets the owner and the operator see and deliver the vendor's orders", async () => {
      const id = await orderId();

      await pay(id);

      const list = (
        await app.inject({
          method: "GET",
          url: `/api/v1/vendors/${vendorId}/orders`,
          headers: operator,
        })
      ).json();

      expect(list.data.map((order: { id: string }) => order.id)).toEqual([id]);

      const detail = (await getOrder(operator, id)).json();

      expect(detail).toMatchObject({
        shipping,
        viewer: { buyer: false, vendor: true },
        allowedActions: ["deliver"],
      });

      const response = await post(app, operator, `/api/v1/orders/${id}/deliver`);

      expect(response.json()).toMatchObject({ status: "delivered" });
      expect(response.json().events.at(-1)).toMatchObject({ actor: "vendor" });
    });

    it("refuses delivery to the buyer and to strangers", async () => {
      const id = await orderId();

      await pay(id);

      expect((await post(app, buyer, `/api/v1/orders/${id}/deliver`)).statusCode).toBe(404);
      expect((await post(app, stranger, `/api/v1/orders/${id}/deliver`)).statusCode).toBe(404);
    });

    it("cannot deliver an unpaid order", async () => {
      const id = await orderId();

      expect((await post(app, owner, `/api/v1/orders/${id}/deliver`)).statusCode).toBe(409);
    });

    it("approves a return with a refund and restores stock", async () => {
      const id = await delivered();

      await post(app, buyer, `/api/v1/orders/${id}/return-requests`, { reason: "Wrong size" });

      const response = await post(app, owner, `/api/v1/orders/${id}/returns/approve`);

      expect(response.json().status).toBe("return_approved");
      expect(response.json().payments.at(-1)).toMatchObject({
        kind: "refund",
        status: "succeeded",
        amountMinor: 1500,
      });
      expect(stockOf(lamp)).toBe(5);
    });

    it("rejects a return only with a reason", async () => {
      const id = await delivered();

      await post(app, buyer, `/api/v1/orders/${id}/return-requests`, { reason: "Wrong size" });

      const missing = await post(app, owner, `/api/v1/orders/${id}/returns/reject`, {});
      const response = await post(app, owner, `/api/v1/orders/${id}/returns/reject`, {
        reason: "Used item",
      });

      expect(missing.statusCode).toBe(400);
      expect(response.json().status).toBe("return_rejected");
      expect(stockOf(lamp)).toBe(4);
    });

    it("hides the vendor's orders from strangers", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/api/v1/vendors/${vendorId}/orders`,
        headers: stranger,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("privacy", () => {
    it("answers 404 to other users", async () => {
      const id = await orderId();

      expect((await getOrder(stranger, id)).statusCode).toBe(404);
      expect((await getOrder(buyer, unknownId)).statusCode).toBe(404);
    });

    it("never returns password hashes or account data", async () => {
      const id = await orderId();
      const body = (await getOrder(owner, id)).body;

      expect(body).not.toMatch(/password|hash|userId/i);
      expect(body).not.toContain("buyer@example.com");
    });
  });

  describe("routes", () => {
    it.each([
      ["GET", "/api/v1/orders"],
      ["POST", "/api/v1/orders"],
      ["GET", `/api/v1/orders/${unknownId}`],
      ["POST", `/api/v1/orders/${unknownId}/payments`],
      ["POST", `/api/v1/orders/${unknownId}/cancel`],
      ["POST", `/api/v1/orders/${unknownId}/deliver`],
      ["GET", `/api/v1/vendors/${unknownId}/orders`],
    ] as const)("%s %s needs a token", async (method, url) => {
      expect((await app.inject({ method, url })).statusCode).toBe(401);
    });

    it("answers 400 for a bad uuid", async () => {
      expect((await getOrder(buyer, "not-a-uuid")).statusCode).toBe(400);
    });

    it("rejects a non-JSON body", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/orders",
        headers: { ...buyer, "content-type": "text/plain" },
        payload: "lines",
      });

      expect([400, 415]).toContain(response.statusCode);
    });
  });
});
