import type { FastifyInstance } from "fastify";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { buildTestApp, TEST_CART, type TestApp } from "../testing/build-test-app.ts";
import { bearerFor, createProduct, createVendor, userData } from "../testing/order-fixtures.ts";

const unknownId = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";

describe("POST /cart/quote", () => {
  let app: FastifyInstance;
  let test: TestApp;
  let owner: Record<string, string>;
  let vendorId: string;

  beforeEach(async () => {
    await app?.close();
    test = await buildTestApp();
    app = test.app;
    owner = await bearerFor(app, userData("owner@example.com"));
    vendorId = await createVendor(app, owner, "acme");
  });

  afterAll(async () => {
    await app.close();
  });

  const quote = (lines: unknown) =>
    app.inject({ method: "POST", url: "/api/v1/cart/quote", payload: { lines } });

  it("is public and prices each line", async () => {
    const productId = await createProduct(app, owner, vendorId, { priceMinor: 1500, stock: 5 });
    const response = await quote([{ productId, quantity: 2 }]);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      lines: [
        {
          productId,
          requestedQuantity: 2,
          quantity: 2,
          status: "ok",
          lineTotalMinor: 3000,
          product: { name: "Lamp", vendorSlug: "acme", stock: 5 },
        },
      ],
      totals: [{ currency: "EUR", totalMinor: 3000 }],
      canCheckout: true,
    });
  });

  it("reduces a quantity above the stock", async () => {
    const productId = await createProduct(app, owner, vendorId, { stock: 2 });
    const line = (await quote([{ productId, quantity: 5 }])).json().lines[0];

    expect(line).toMatchObject({ status: "quantityReduced", quantity: 2, requestedQuantity: 5 });
  });

  it("marks sold out, unknown, deleted and orphaned products", async () => {
    const soldOut = await createProduct(app, owner, vendorId, { stock: 0 });
    const deleted = await createProduct(app, owner, vendorId);

    await app.inject({ method: "DELETE", url: `/api/v1/products/${deleted}`, headers: owner });

    const otherOwner = await bearerFor(app, userData("other@example.com"));
    const otherVendor = await createVendor(app, otherOwner, "gone");
    const orphan = await createProduct(app, otherOwner, otherVendor);

    await app.inject({
      method: "DELETE",
      url: `/api/v1/vendors/${otherVendor}`,
      headers: otherOwner,
    });

    const body = (
      await quote([
        { productId: soldOut, quantity: 1 },
        { productId: unknownId, quantity: 1 },
        { productId: deleted, quantity: 1 },
        { productId: orphan, quantity: 1 },
      ])
    ).json();

    expect(body.lines.map((line: { status: string }) => line.status)).toEqual([
      "outOfStock",
      "unavailable",
      "unavailable",
      "unavailable",
    ]);
    expect(body.totals).toEqual([]);
    expect(body.canCheckout).toBe(false);
  });

  it("merges duplicate products", async () => {
    const productId = await createProduct(app, owner, vendorId, { stock: 10 });
    const body = (
      await quote([
        { productId, quantity: 2 },
        { productId, quantity: 3 },
      ])
    ).json();

    expect(body.lines).toHaveLength(1);
    expect(body.lines[0].quantity).toBe(5);
  });

  it("keeps totals per currency", async () => {
    const eur = await createProduct(app, owner, vendorId, { priceMinor: 100 });
    const rsd = await createProduct(app, owner, vendorId, { priceMinor: 500, currency: "RSD" });
    const body = (
      await quote([
        { productId: eur, quantity: 1 },
        { productId: rsd, quantity: 2 },
      ])
    ).json();

    expect(body.totals).toEqual([
      { currency: "EUR", totalMinor: 100 },
      { currency: "RSD", totalMinor: 1000 },
    ]);
  });

  it("rejects more lines than the limit", async () => {
    const lines = Array.from({ length: TEST_CART.maxLines + 1 }, () => ({
      productId: crypto.randomUUID(),
      quantity: 1,
    }));

    expect((await quote(lines)).statusCode).toBe(400);
  });

  it.each([
    [[]],
    [[{ productId: "not-a-uuid", quantity: 1 }]],
    [[{ productId: unknownId, quantity: 0 }]],
    [[{ productId: unknownId, quantity: 1.5 }]],
  ])("rejects invalid lines %j", async (lines) => {
    expect((await quote(lines)).statusCode).toBe(400);
  });
});
