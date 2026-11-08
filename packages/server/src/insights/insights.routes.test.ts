import type { FastifyInstance } from "fastify";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { buildTestApp, type TestApp } from "../testing/build-test-app.ts";
import {
  bearerFor,
  createProduct,
  createVendor,
  userData,
  type Headers,
} from "../testing/order-fixtures.ts";

const unknownId = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";

describe("insights routes", () => {
  let test: TestApp;
  let app: FastifyInstance;
  let owner: Headers;
  let operator: Headers;
  let outsider: Headers;
  let admin: Headers;
  let vendorId: string;
  let productId: string;

  beforeEach(async () => {
    await app?.close();
    test = await buildTestApp();
    app = test.app;

    owner = await bearerFor(app, userData("owner@example.com", "Olga"));
    operator = await bearerFor(app, userData("op@example.com", "Oscar"));
    outsider = await bearerFor(app, userData("out@example.com", "Ana"));
    await bearerFor(app, userData("admin@example.com", "Ada"));
    makeAdmin("admin@example.com");

    admin = await bearerFor(app, userData("admin@example.com", "Ada"));
    vendorId = await createVendor(app, owner, "acme");
    productId = await createProduct(app, owner, vendorId);

    await app.inject({
      method: "POST",
      url: `/api/v1/vendors/${vendorId}/operators`,
      headers: owner,
      payload: { email: "op@example.com" },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  function makeAdmin(email: string): void {
    const row = test.repository.rows.find((candidate) => candidate.email === email);

    if (row !== undefined) {
      row.role = "administrator";
    }
  }

  const get = (url: string, headers: Headers) =>
    app.inject({ method: "GET", url: `/api/v1${url}`, headers });

  it("requires a token", async () => {
    expect((await get("/insights/vendors", {})).statusCode).toBe(401);
  });

  it("lists the vendors the caller owns or operates", async () => {
    const ownerList = await get("/insights/vendors", owner);
    const operatorList = await get("/insights/vendors", operator);

    expect(ownerList.json().data.map((row: { slug: string }) => row.slug)).toEqual(["acme"]);
    expect(ownerList.json().data[0].viewerRole).toBe("owner");
    expect(operatorList.json().data[0].viewerRole).toBe("operator");
  });

  it("gives an empty list to someone who works for no vendor", async () => {
    const response = await get("/insights/vendors", outsider);

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual([]);
  });

  it("gives an administrator no special access to the list", async () => {
    const response = await get("/insights/vendors", admin);

    expect(response.json().data).toEqual([]);
    expect(response.json().meta.total).toBe(0);
  });

  it("hides vendor insights from an administrator who is not a member", async () => {
    expect((await get(`/insights/vendors/${vendorId}`, admin)).statusCode).toBe(404);
  });

  it("hides product insights from an administrator who is not a member", async () => {
    expect((await get(`/insights/products/${productId}`, admin)).statusCode).toBe(404);
  });

  it("shows an administrator the vendor they own", async () => {
    const adminVendorId = await createVendor(app, admin, "adminco");

    const list = await get("/insights/vendors", admin);
    const detail = await get(`/insights/vendors/${adminVendorId}`, admin);

    expect(list.json().data.map((row: { slug: string }) => row.slug)).toEqual(["adminco"]);
    expect(detail.statusCode).toBe(200);
    expect((await get(`/insights/vendors/${vendorId}`, admin)).statusCode).toBe(404);
  });

  it("answers 404 for outsiders and unknown ids alike", async () => {
    expect((await get(`/insights/vendors/${vendorId}`, outsider)).statusCode).toBe(404);
    expect((await get(`/insights/vendors/${unknownId}`, owner)).statusCode).toBe(404);
    expect((await get(`/insights/products/${productId}`, outsider)).statusCode).toBe(404);
    expect((await get(`/insights/products/${unknownId}`, owner)).statusCode).toBe(404);
  });

  it("lets owners and operators open vendor and product insights", async () => {
    for (const headers of [owner, operator]) {
      expect((await get(`/insights/vendors/${vendorId}`, headers)).statusCode).toBe(200);
      expect((await get(`/insights/products/${productId}`, headers)).statusCode).toBe(200);
    }
  });

  it("rejects a malformed id and unknown query values", async () => {
    expect((await get("/insights/vendors/not-a-uuid", owner)).statusCode).toBe(400);
    expect((await get("/insights/vendors?period=1y", owner)).statusCode).toBe(400);
    expect((await get("/insights/vendors?currency=GBP", owner)).statusCode).toBe(400);
  });

  it("filters the list by relation and search", async () => {
    expect((await get("/insights/vendors?relation=operated", owner)).json().data).toEqual([]);
    expect((await get("/insights/vendors?relation=operated", operator)).json().data).toHaveLength(
      1,
    );
    expect((await get("/insights/vendors?search=zzz", owner)).json().data).toEqual([]);
    expect((await get("/insights/vendors?search=ACM", owner)).json().data).toHaveLength(1);
  });

  it("picks the currency with the most paid orders and lists the others", async () => {
    test.insightsRepository.usage = [
      { currency: "RSD", orders: 5 },
      { currency: "EUR", orders: 2 },
    ];

    const meta = (await get(`/insights/vendors/${vendorId}`, owner)).json().meta;

    expect(meta).toEqual({ period: "30d", currency: "RSD", currencies: ["RSD", "EUR"] });

    const chosen = (await get(`/insights/vendors/${vendorId}?currency=EUR`, owner)).json().meta;

    expect(chosen.currency).toBe("EUR");
  });

  it("computes net revenue and deltas from the current and previous period", async () => {
    test.insightsRepository.totals = {
      grossMinor: 1000,
      refundedMinor: 200,
      orders: 4,
      refundedOrders: 1,
      units: 6,
    };
    test.insightsRepository.previousTotals = {
      grossMinor: 500,
      refundedMinor: 0,
      orders: 2,
      refundedOrders: 0,
      units: 3,
    };

    const { kpis } = (await get(`/insights/vendors/${vendorId}`, owner)).json();

    expect(kpis.netMinor).toEqual({ value: 800, previous: 500 });
    expect(kpis.averageOrderMinor).toEqual({ value: 250, previous: 250 });
    expect(kpis.refundRate).toEqual({ value: 0.25, previous: 0 });
  });

  it("has no previous values for all time", async () => {
    const { kpis } = (await get(`/insights/vendors/${vendorId}?period=all`, owner)).json();

    expect(kpis.netMinor.previous).toBeNull();
  });

  it("fills gaps in the series with zeros", async () => {
    test.insightsRepository.revenueSeries = [{ bucket: "2026-01-01", netMinor: 700, orders: 2 }];

    const { revenueSeries } = (await get(`/insights/vendors/${vendorId}?period=7d`, owner)).json();

    expect(revenueSeries).toHaveLength(8);
    expect(revenueSeries.at(-1)).toEqual({ bucket: "2026-01-01", netMinor: 700, orders: 2 });
    expect(revenueSeries[0]).toEqual({ bucket: "2025-12-25", netMinor: 0, orders: 0 });
  });

  it("always returns all five rating buckets for a product", async () => {
    test.insightsRepository.ratingDistribution = [{ rating: 4, count: 3 }];

    const { ratingDistribution } = (await get(`/insights/products/${productId}`, owner)).json();

    expect(ratingDistribution).toEqual([
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 3 },
      { rating: 5, count: 0 },
    ]);
  });
});
