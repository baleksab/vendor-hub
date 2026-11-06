import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../app.ts";
import type { DatabaseHandle } from "../db/client.ts";
import { productReviews, products, users, vendorReviews, vendors } from "../db/schema.ts";
import { TEST_IMAGES, validUser } from "../testing/build-test-app.ts";
import { drizzleAppOptions } from "../testing/drizzle-app-options.ts";
import { createTestDatabase, truncateAll } from "../testing/test-database.ts";

const owner = { ...validUser, email: "owner@example.com", firstName: "Olga" };
const operator = { ...validUser, email: "op@example.com", firstName: "Oscar" };
const outsider = { ...validUser, email: "out@example.com", firstName: "Ana", lastName: "Zivkovic" };
const reviewer = {
  ...validUser,
  email: "rev@example.com",
  firstName: "Rita",
  lastName: "Reviewer",
};
const admin = { ...validUser, email: "admin@example.com", firstName: "Ada" };

const acme = { slug: "acme", name: "Acme Inc", description: "We sell everything you need." };
const unknownId = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(32)]);

type Headers = Record<string, string>;

function product(overrides: Record<string, unknown> = {}) {
  return {
    name: "Smart televizor",
    description: "Veliki ekran",
    category: "tv-audio",
    priceMinor: 50000,
    currency: "EUR",
    stock: 5,
    ...overrides,
  };
}

function multipart(content: Buffer, filename = "photo.jpg") {
  const boundary = "----vendorhubboundary";
  const head = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/jpeg\r\n\r\n`;
  const payload = Buffer.concat([
    Buffer.from(head),
    content,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  return { payload, contentType: `multipart/form-data; boundary=${boundary}` };
}

describe("products, reviews and images against Postgres", () => {
  let handle: DatabaseHandle;
  let app: FastifyInstance;

  beforeAll(async () => {
    handle = await createTestDatabase();
    app = await buildApp(drizzleAppOptions(handle));
    await app.ready();
  });

  beforeEach(async () => {
    await truncateAll(handle);
  });

  afterAll(async () => {
    await app.close();
    await handle.pool.end().catch(() => undefined);
  });

  async function bearerFor(user: Record<string, unknown>): Promise<Headers> {
    await app.inject({ method: "POST", url: "/api/v1/users", payload: user });

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth",
      payload: { email: user.email, password: user.password },
    });

    return { authorization: `Bearer ${login.json().accessToken}` };
  }

  async function administrator(): Promise<Headers> {
    const headers = await bearerFor(admin);

    await handle.db
      .update(users)
      .set({ role: "administrator" })
      .where(eq(users.email, String(admin.email).toLowerCase()));

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth",
      payload: { email: admin.email, password: admin.password },
    });

    return headers && { authorization: `Bearer ${login.json().accessToken}` };
  }

  async function setupVendor() {
    const ownerHeaders = await bearerFor(owner);
    const registered = await app.inject({
      method: "POST",
      url: "/api/v1/vendors",
      headers: ownerHeaders,
      payload: acme,
    });
    const vendorId: string = registered.json().id;

    const operatorHeaders = await bearerFor(operator);

    await app.inject({
      method: "POST",
      url: "/api/v1/vendors/me/operators",
      headers: ownerHeaders,
      payload: { email: operator.email },
    });

    return { vendorId, ownerHeaders, operatorHeaders };
  }

  async function createProduct(
    headers: Headers,
    vendorId: string,
    overrides: Record<string, unknown> = {},
  ) {
    const response = await app.inject({
      method: "POST",
      url: `/api/v1/vendors/${vendorId}/products`,
      headers,
      payload: product(overrides),
    });

    return { response, id: response.json().id as string };
  }

  const search = async (query = "") => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/vendors/by-slug/acme/products${query === "" ? "" : `?${query}`}`,
    });

    return response.json() as {
      data: { id: string; name: string; coverImageId: string | null }[];
      meta: { total: number; limit: number; offset: number };
    };
  };

  const names = async (query = "") => (await search(query)).data.map((item) => item.name);

  describe("permissions", () => {
    it("lets the owner, the operator and an administrator manage products and hides them from others", async () => {
      const { vendorId, ownerHeaders, operatorHeaders } = await setupVendor();
      const outsiderHeaders = await bearerFor(outsider);
      const adminHeaders = await administrator();

      for (const headers of [ownerHeaders, operatorHeaders, adminHeaders]) {
        const created = await createProduct(headers, vendorId);

        expect(created.response.statusCode).toBe(201);
      }

      const denied = await app.inject({
        method: "POST",
        url: `/api/v1/vendors/${vendorId}/products`,
        headers: outsiderHeaders,
        payload: product(),
      });

      expect(denied.statusCode).toBe(404);

      const anonymous = await app.inject({
        method: "POST",
        url: `/api/v1/vendors/${vendorId}/products`,
        payload: product(),
      });

      expect(anonymous.statusCode).toBe(401);

      const { id } = await createProduct(ownerHeaders, vendorId);

      for (const method of ["PATCH", "DELETE"] as const) {
        const response = await app.inject({
          method,
          url: `/api/v1/products/${id}`,
          headers: outsiderHeaders,
          payload: method === "PATCH" ? { stock: 1 } : undefined,
        });

        expect(response.statusCode).toBe(404);
      }
    });

    it("validates the body and the category", async () => {
      const { vendorId, ownerHeaders } = await setupVendor();
      const bad = (overrides: Record<string, unknown>) =>
        createProduct(ownerHeaders, vendorId, overrides).then(
          ({ response }) => response.statusCode,
        );

      expect(await bad({ priceMinor: -1 })).toBe(400);
      expect(await bad({ stock: -1 })).toBe(400);
      expect(await bad({ category: "unknown" })).toBe(400);
      expect(await bad({ category: "electronics" })).toBe(400);
      expect(await bad({ currency: "XXX" })).toBe(400);

      const { id } = await createProduct(ownerHeaders, vendorId);
      const empty = await app.inject({
        method: "PATCH",
        url: `/api/v1/products/${id}`,
        headers: ownerHeaders,
        payload: {},
      });

      expect(empty.statusCode).toBe(400);
    });

    it("updates and soft deletes a product", async () => {
      const { vendorId, ownerHeaders } = await setupVendor();
      const { id } = await createProduct(ownerHeaders, vendorId);

      const patched = await app.inject({
        method: "PATCH",
        url: `/api/v1/products/${id}`,
        headers: ownerHeaders,
        payload: { stock: 0, priceMinor: 100 },
      });

      expect(patched.json()).toMatchObject({
        stock: 0,
        priceMinor: 100,
        parentCategory: "electronics",
      });

      const deleted = await app.inject({
        method: "DELETE",
        url: `/api/v1/products/${id}`,
        headers: ownerHeaders,
      });

      expect(deleted.statusCode).toBe(204);
      expect((await app.inject({ method: "GET", url: `/api/v1/products/${id}` })).statusCode).toBe(
        404,
      );
      expect(await names()).toEqual([]);

      const [row] = await handle.db.select().from(products).where(eq(products.id, id));

      expect(row?.isDeleted).toBe(true);
    });

    it("returns 400 for a bad uuid and 404 for an unknown product", async () => {
      expect((await app.inject({ method: "GET", url: "/api/v1/products/nope" })).statusCode).toBe(
        400,
      );
      expect(
        (await app.inject({ method: "GET", url: `/api/v1/products/${unknownId}` })).statusCode,
      ).toBe(404);
    });
  });

  describe("search", () => {
    async function seed() {
      const { vendorId, ownerHeaders } = await setupVendor();
      const add = (overrides: Record<string, unknown>) =>
        createProduct(ownerHeaders, vendorId, overrides);

      const tv = await add({
        name: "Televizor",
        category: "tv-audio",
        priceMinor: 30000,
        stock: 3,
      });
      const phone = await add({
        name: "Telefon",
        description: "pametni televizor u dzepu",
        category: "phones",
        priceMinor: 20000,
        stock: 0,
      });
      const chair = await add({
        name: "Stolica 100%",
        description: "drvena",
        category: "furniture",
        priceMinor: 5000,
        stock: 10,
      });
      const other = await add({
        name: "Stolica_2",
        description: "plasticna",
        category: "other",
        priceMinor: 1000,
        stock: 1,
      });

      return { vendorId, ownerHeaders, tv, phone, chair, other };
    }

    it("matches parts of words, ranks name matches first and escapes wildcards", async () => {
      await seed();

      expect((await names("q=tele")).sort()).toEqual(["Telefon", "Televizor"]);
      expect((await names("q=televizor"))[0]).toBe("Televizor");
      expect(await names("q=televizor")).toHaveLength(2);
      expect(await names("q=100%25")).toEqual(["Stolica 100%"]);
      expect(await names("q=a_2")).toEqual(["Stolica_2"]);
      expect(await names("q=%25")).toEqual(["Stolica 100%"]);
    });

    it("filters by parent category including children, by price, stock and rating", async () => {
      const { tv } = await seed();

      expect((await names("category=electronics")).sort()).toEqual(["Televizor", "Telefon"].sort());
      expect(await names("category=phones")).toEqual(["Telefon"]);
      expect(await names("minPrice=5000&maxPrice=20000&sort=priceAsc")).toEqual([
        "Stolica 100%",
        "Telefon",
      ]);
      expect((await names("inStock=true")).sort()).toEqual([
        "Stolica 100%",
        "Stolica_2",
        "Televizor",
      ]);

      await handle.db
        .update(products)
        .set({ ratingAvg: 4.5, ratingCount: 2 })
        .where(eq(products.id, tv.id));

      expect(await names("minRating=4")).toEqual(["Televizor"]);
      expect(await names("minRating=5")).toEqual([]);
    });

    it("sorts with a stable tie break and paginates with a correct total", async () => {
      await seed();

      expect(await names("sort=priceAsc")).toEqual([
        "Stolica_2",
        "Stolica 100%",
        "Telefon",
        "Televizor",
      ]);
      expect(await names("sort=priceDesc")).toEqual([
        "Televizor",
        "Telefon",
        "Stolica 100%",
        "Stolica_2",
      ]);
      expect(await names("sort=name")).toEqual([
        "Stolica 100%",
        "Stolica_2",
        "Telefon",
        "Televizor",
      ]);
      expect(await names("sort=newest")).toEqual([
        "Stolica_2",
        "Stolica 100%",
        "Telefon",
        "Televizor",
      ]);

      const page = await search("sort=priceAsc&limit=2&offset=1");

      expect(page.meta).toEqual({ total: 4, limit: 2, offset: 1 });
      expect(page.data.map((item) => item.name)).toEqual(["Stolica 100%", "Telefon"]);

      const filtered = await search("category=electronics&limit=1");

      expect(filtered.meta.total).toBe(2);
      expect(filtered.data).toHaveLength(1);
    });

    it("counts categories following the other filters but not the category itself", async () => {
      await seed();

      const counts = async (query = "") =>
        (
          await app.inject({
            method: "GET",
            url: `/api/v1/vendors/by-slug/acme/product-categories${query === "" ? "" : `?${query}`}`,
          })
        ).json().data;

      expect(await counts()).toEqual([
        { category: "furniture", count: 1 },
        { category: "other", count: 1 },
        { category: "phones", count: 1 },
        { category: "tv-audio", count: 1 },
      ]);
      expect(await counts("inStock=true")).toEqual([
        { category: "furniture", count: 1 },
        { category: "other", count: 1 },
        { category: "tv-audio", count: 1 },
      ]);
    });

    it("never shows deleted products or products of deleted vendors", async () => {
      const { vendorId, ownerHeaders } = await seed();

      expect(await names()).toHaveLength(4);

      const deleted = await app.inject({
        method: "DELETE",
        url: `/api/v1/vendors/${vendorId}`,
        headers: ownerHeaders,
      });

      expect(deleted.statusCode).toBe(204);

      const rows = await handle.db.select().from(products).where(eq(products.vendorId, vendorId));

      expect(rows).toHaveLength(4);
      expect(rows.every((row) => row.isDeleted)).toBe(true);
      expect(
        (await app.inject({ method: "GET", url: "/api/v1/vendors/by-slug/acme/products" }))
          .statusCode,
      ).toBe(404);
    });

    it("rejects invalid filters", async () => {
      await seed();

      expect(
        (
          await app.inject({
            method: "GET",
            url: "/api/v1/vendors/by-slug/acme/products?category=nope",
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/api/v1/vendors/by-slug/acme/products?minRating=9",
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/api/v1/vendors/by-slug/acme/products?inStock=maybe",
          })
        ).statusCode,
      ).toBe(400);
    });
  });

  describe("reviews", () => {
    const putReview = (headers: Headers, base: string, id: string, body: Record<string, unknown>) =>
      app.inject({
        method: "PUT",
        url: `/api/v1/${base}/${id}/reviews/me`,
        headers,
        payload: body,
      });

    it("creates, replaces and deletes a product review and keeps the aggregates in step", async () => {
      const { vendorId, ownerHeaders } = await setupVendor();
      const { id } = await createProduct(ownerHeaders, vendorId);
      const rita = await bearerFor(reviewer);
      const ana = await bearerFor(outsider);

      const first = await putReview(rita, "products", id, { rating: 5, comment: "Super" });

      expect(first.statusCode).toBe(200);
      expect(first.json()).toMatchObject({ authorName: "Rita R.", rating: 5, comment: "Super" });
      expect(JSON.stringify(first.json())).not.toMatch(/email|example\.com/i);

      await putReview(ana, "products", id, { rating: 2 });

      const afterSecond = await app.inject({ method: "GET", url: `/api/v1/products/${id}` });

      expect(afterSecond.json()).toMatchObject({ ratingAvg: 3.5, ratingCount: 2 });

      const replaced = await putReview(rita, "products", id, { rating: 4, comment: "  " });

      expect(replaced.json()).toMatchObject({ rating: 4, comment: null, id: first.json().id });

      const list = await app.inject({ method: "GET", url: `/api/v1/products/${id}/reviews` });

      expect(list.json().meta.total).toBe(2);
      expect(list.json().summary).toEqual({
        ratingAvg: 3,
        ratingCount: 2,
        distribution: [0, 1, 0, 1, 0],
      });

      const removed = await app.inject({
        method: "DELETE",
        url: `/api/v1/products/${id}/reviews/${first.json().id}`,
        headers: rita,
      });

      expect(removed.statusCode).toBe(204);
      expect(
        (await app.inject({ method: "GET", url: `/api/v1/products/${id}` })).json(),
      ).toMatchObject({
        ratingAvg: 2,
        ratingCount: 1,
      });

      const [row] = await handle.db.select().from(products).where(eq(products.id, id));

      expect(row).toMatchObject({ ratingAvg: 2, ratingCount: 1 });
    });

    it("lets a user review again after deleting (partial unique index)", async () => {
      const { vendorId, ownerHeaders } = await setupVendor();
      const { id } = await createProduct(ownerHeaders, vendorId);
      const rita = await bearerFor(reviewer);

      const first = await putReview(rita, "products", id, { rating: 3 });

      await app.inject({
        method: "DELETE",
        url: `/api/v1/products/${id}/reviews/${first.json().id}`,
        headers: rita,
      });

      const again = await putReview(rita, "products", id, { rating: 5 });

      expect(again.statusCode).toBe(200);
      expect(again.json().id).not.toBe(first.json().id);

      const rows = await handle.db
        .select()
        .from(productReviews)
        .where(eq(productReviews.targetId, id));

      expect(rows).toHaveLength(2);
      expect(rows.filter((row) => !row.isDeleted)).toHaveLength(1);
    });

    it("forbids members, validates bounds and requires a token", async () => {
      const { vendorId, ownerHeaders, operatorHeaders } = await setupVendor();
      const { id } = await createProduct(ownerHeaders, vendorId);
      const rita = await bearerFor(reviewer);

      expect((await putReview(ownerHeaders, "products", id, { rating: 5 })).statusCode).toBe(403);
      expect(
        (await putReview(operatorHeaders, "vendors", vendorId, { rating: 5 })).statusCode,
      ).toBe(403);
      expect((await putReview(rita, "products", id, { rating: 0 })).statusCode).toBe(400);
      expect((await putReview(rita, "products", id, { rating: 6 })).statusCode).toBe(400);
      expect(
        (await putReview(rita, "products", id, { rating: 3, comment: "x".repeat(1001) }))
          .statusCode,
      ).toBe(400);
      expect((await putReview(rita, "products", unknownId, { rating: 3 })).statusCode).toBe(404);
      expect(
        (
          await app.inject({
            method: "PUT",
            url: `/api/v1/products/${id}/reviews/me`,
            payload: { rating: 3 },
          })
        ).statusCode,
      ).toBe(401);
    });

    it("lets the author, a vendor member and an administrator delete, and nobody else", async () => {
      const { vendorId, ownerHeaders, operatorHeaders } = await setupVendor();
      const { id } = await createProduct(ownerHeaders, vendorId);
      const rita = await bearerFor(reviewer);
      const ana = await bearerFor(outsider);
      const adminHeaders = await administrator();

      const remove = (headers: Headers, reviewId: string) =>
        app.inject({
          method: "DELETE",
          url: `/api/v1/products/${id}/reviews/${reviewId}`,
          headers,
        });

      for (const [deleter, expected] of [
        [ana, 404],
        [ownerHeaders, 204],
        [operatorHeaders, 204],
        [adminHeaders, 204],
      ] as const) {
        const review = await putReview(rita, "products", id, { rating: 1, comment: "spam" });
        const response = await remove(deleter, review.json().id);

        expect(response.statusCode).toBe(expected);

        if (expected === 404) {
          expect((await remove(rita, review.json().id)).statusCode).toBe(204);
        }
      }
    });

    it("reviews vendors and updates the vendor aggregate, shown on the public page", async () => {
      const { vendorId } = await setupVendor();
      const rita = await bearerFor(reviewer);
      const ana = await bearerFor(outsider);

      await putReview(rita, "vendors", vendorId, { rating: 5, comment: "Fast" });

      const second = await putReview(ana, "vendors", vendorId, { rating: 4 });

      const page = await app.inject({ method: "GET", url: "/api/v1/vendors/by-slug/acme" });

      expect(page.json()).toMatchObject({ id: vendorId, ratingAvg: 4.5, ratingCount: 2 });

      const list = await app.inject({ method: "GET", url: "/api/v1/vendors/by-slug/acme/reviews" });

      expect(list.json().data).toHaveLength(2);

      await app.inject({
        method: "DELETE",
        url: `/api/v1/vendors/${vendorId}/reviews/${second.json().id}`,
        headers: ana,
      });

      const [row] = await handle.db.select().from(vendors).where(eq(vendors.id, vendorId));

      expect(row).toMatchObject({ ratingAvg: 5, ratingCount: 1 });
      expect(
        (await handle.db.select().from(vendorReviews)).filter((r) => !r.isDeleted),
      ).toHaveLength(1);
    });
  });

  describe("images", () => {
    const upload = (headers: Headers, id: string, content: Buffer, filename?: string) => {
      const { payload, contentType } = multipart(content, filename);

      return app.inject({
        method: "POST",
        url: `/api/v1/products/${id}/images`,
        headers: { ...headers, "content-type": contentType },
        payload,
      });
    };

    it("accepts images by magic bytes, serves them with immutable caching and shows the cover", async () => {
      const { vendorId, ownerHeaders } = await setupVendor();
      const { id } = await createProduct(ownerHeaders, vendorId);

      const first = await upload(ownerHeaders, id, JPEG);

      expect(first.statusCode).toBe(201);
      expect(first.json()).toMatchObject({ position: 0, contentType: "image/jpeg" });

      const served = await app.inject({
        method: "GET",
        url: `/api/v1/product-images/${first.json().id}`,
      });

      expect(served.statusCode).toBe(200);
      expect(served.headers["content-type"]).toContain("image/jpeg");
      expect(served.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
      expect(served.rawPayload.equals(JPEG)).toBe(true);
      expect((await search()).data[0]?.coverImageId).toBe(first.json().id);
    });

    it("rejects a wrong type, too big files and too many images", async () => {
      const { vendorId, ownerHeaders } = await setupVendor();
      const { id } = await createProduct(ownerHeaders, vendorId);

      expect(
        (await upload(ownerHeaders, id, Buffer.from("MZ not an image"), "evil.jpg")).statusCode,
      ).toBe(415);
      expect(
        (await upload(ownerHeaders, id, Buffer.concat([JPEG, Buffer.alloc(TEST_IMAGES.maxBytes)])))
          .statusCode,
      ).toBe(413);
      expect((await upload(ownerHeaders, id, JPEG)).statusCode).toBe(201);
      expect((await upload(ownerHeaders, id, PNG)).statusCode).toBe(201);
      expect((await upload(ownerHeaders, id, PNG)).statusCode).toBe(409);
    });

    it("hides uploads from outsiders and keeps the order consistent", async () => {
      const { vendorId, ownerHeaders } = await setupVendor();
      const { id } = await createProduct(ownerHeaders, vendorId);
      const outsiderHeaders = await bearerFor(outsider);

      expect((await upload(outsiderHeaders, id, JPEG)).statusCode).toBe(404);

      const a = (await upload(ownerHeaders, id, JPEG)).json().id as string;
      const b = (await upload(ownerHeaders, id, PNG)).json().id as string;

      const reorder = (imageIds: string[]) =>
        app.inject({
          method: "PUT",
          url: `/api/v1/products/${id}/images/order`,
          headers: ownerHeaders,
          payload: { imageIds },
        });

      expect((await reorder([a])).statusCode).toBe(400);
      expect((await reorder([a, a])).statusCode).toBe(400);

      const swapped = await reorder([b, a]);

      expect(swapped.statusCode).toBe(200);
      expect(swapped.json().images.map((image: { id: string }) => image.id)).toEqual([b, a]);

      const removed = await app.inject({
        method: "DELETE",
        url: `/api/v1/products/${id}/images/${b}`,
        headers: ownerHeaders,
      });

      expect(removed.statusCode).toBe(204);
      expect(
        (await app.inject({ method: "GET", url: `/api/v1/product-images/${b}` })).statusCode,
      ).toBe(404);
      expect(
        (await app.inject({ method: "GET", url: `/api/v1/products/${id}` })).json().images,
      ).toHaveLength(1);
    });
  });

  it("serves the fixed category tree", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/categories" });

    expect(response.statusCode).toBe(200);
    expect(response.json().data[0]).toMatchObject({ slug: "electronics" });
    expect(response.json().data[0].children.map((child: { slug: string }) => child.slug)).toContain(
      "phones",
    );
  });
});
