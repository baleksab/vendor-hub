import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../app.ts";
import type { DatabaseHandle } from "../db/client.ts";
import { orders } from "../db/schema.ts";
import type { OrderStatus } from "../orders/order-status.ts";
import { drizzleAppOptions } from "../testing/drizzle-app-options.ts";
import {
  bearerFor,
  createProduct,
  createVendor,
  placeOrder,
  userData,
  type Headers,
} from "../testing/order-fixtures.ts";
import { createTestDatabase, truncateAll } from "../testing/test-database.ts";

const DAY_MS = 86_400_000;

describe("insights against Postgres", () => {
  let handle: DatabaseHandle;
  let app: FastifyInstance;
  let owner: Headers;
  let buyer: Headers;
  let outsider: Headers;
  let vendorId: string;
  let lampId: string;
  let radioId: string;

  beforeAll(async () => {
    handle = await createTestDatabase();
    app = await buildApp(drizzleAppOptions(handle));
    await app.ready();
  });

  beforeEach(async () => {
    await truncateAll(handle);
    owner = await bearerFor(app, userData("owner@example.com"));
    buyer = await bearerFor(app, userData("buyer@example.com"));
    outsider = await bearerFor(app, userData("out@example.com"));
    vendorId = await createVendor(app, owner, "acme");
    lampId = await createProduct(app, owner, vendorId, { stock: 50 });
    radioId = await createProduct(app, owner, vendorId, {
      name: "Radio",
      currency: "RSD",
      priceMinor: 10_000,
      stock: 50,
    });
  });

  afterAll(async () => {
    await app.close();
    await handle.pool.end().catch(() => undefined);
  });

  async function order(
    productId: string,
    quantity: number,
    status: OrderStatus,
    paidDaysAgo: number | null,
  ): Promise<void> {
    const response = await placeOrder(app, buyer, [{ productId, quantity }]);
    const [created] = response.json().data;

    await handle.db
      .update(orders)
      .set({
        status,
        paidAt: paidDaysAgo === null ? null : new Date(Date.now() - paidDaysAgo * DAY_MS),
      })
      .where(eq(orders.id, created.id));
  }

  async function seed(): Promise<void> {
    await order(lampId, 2, "paid", 2);
    await order(lampId, 1, "return_approved", 1);
    await order(lampId, 1, "created", null);
    await order(lampId, 1, "closed", 40);
    await order(lampId, 1, "closed", 100);
    await order(radioId, 3, "delivered", 3);
  }

  const get = (url: string, headers: Headers = owner) =>
    app.inject({ method: "GET", url: `/api/v1${url}`, headers });

  it("sums only paid orders of one currency and subtracts refunds", async () => {
    await seed();

    const body = (await get(`/insights/vendors/${vendorId}?period=30d&currency=EUR`)).json();

    expect(body.kpis.grossMinor.value).toBe(4500);
    expect(body.kpis.refundedMinor.value).toBe(1500);
    expect(body.kpis.netMinor.value).toBe(3000);
    expect(body.kpis.orders.value).toBe(2);
    expect(body.kpis.units.value).toBe(3);
    expect(body.kpis.refundRate.value).toBe(0.5);
    expect(body.kpis.netMinor.previous).toBe(1500);
  });

  it("reports currencies by number of paid orders and defaults to the busiest", async () => {
    await seed();

    const { meta } = (await get(`/insights/vendors/${vendorId}?period=30d`)).json();

    expect(meta.currencies).toEqual(["EUR", "RSD"]);
    expect(meta.currency).toBe("EUR");

    const rsd = (await get(`/insights/vendors/${vendorId}?currency=RSD`)).json();

    expect(rsd.kpis.netMinor.value).toBe(30_000);
  });

  it("excludes orders outside the period but includes them for all time", async () => {
    await seed();

    const all = (await get(`/insights/vendors/${vendorId}?period=all&currency=EUR`)).json();

    expect(all.kpis.netMinor.value).toBe(6000);
    expect(all.kpis.netMinor.previous).toBeNull();
  });

  it("buckets the series by day and keeps the total", async () => {
    await seed();

    const { revenueSeries } = (
      await get(`/insights/vendors/${vendorId}?period=7d&currency=EUR`)
    ).json();

    expect(revenueSeries).toHaveLength(8);
    expect(
      revenueSeries.reduce((sum: number, point: { netMinor: number }) => sum + point.netMinor, 0),
    ).toBe(3000);
  });

  it("ranks top products and counts statuses and countries", async () => {
    await seed();

    const body = (await get(`/insights/vendors/${vendorId}?period=30d&currency=EUR`)).json();

    expect(body.topProducts[0]).toMatchObject({
      productId: lampId,
      unitsSold: 2,
      netMinor: 3000,
      available: true,
    });
    expect(body.ordersByStatus).toEqual(expect.arrayContaining([{ status: "created", count: 1 }]));
    expect(body.topCountries[0]).toMatchObject({ country: "RS", orders: 2 });
    expect(body.catalog.productCount).toBe(2);
  });

  it("returns product insights with units, refunds and rating buckets", async () => {
    await seed();

    const body = (await get(`/insights/products/${lampId}?period=30d&currency=EUR`)).json();

    expect(body.kpis.units.value).toBe(3);
    expect(body.kpis.netMinor.value).toBe(3000);
    expect(body.kpis.refundedMinor.value).toBe(1500);
    expect(body.ratingDistribution).toHaveLength(5);
  });

  it("lists, sorts and filters the caller's vendors", async () => {
    await seed();

    const other = await bearerFor(app, userData("other@example.com"));
    await createVendor(app, other, "bolt");

    const list = (await get("/insights/vendors?currency=EUR&period=30d")).json();

    expect(list.data).toHaveLength(1);
    expect(list.data[0]).toMatchObject({
      slug: "acme",
      viewerRole: "owner",
      productCount: 2,
      orderCount: 2,
      netMinor: 3000,
      previousNetMinor: 1500,
    });
    expect((await get("/insights/vendors?search=acm")).json().data).toHaveLength(1);
    expect((await get("/insights/vendors?search=bolt")).json().data).toEqual([]);
    expect((await get("/insights/vendors?sort=products&order=asc")).statusCode).toBe(200);
    expect((await get("/insights/vendors", outsider)).json().data).toEqual([]);
  });

  it("denies outsiders", async () => {
    expect((await get(`/insights/vendors/${vendorId}`, outsider)).statusCode).toBe(404);
    expect((await get(`/insights/products/${lampId}`, outsider)).statusCode).toBe(404);
  });
});
