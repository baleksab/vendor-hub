import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from "../shared/seo.ts";
import { buildTestApp, validUser, type TestApp } from "../testing/build-test-app.ts";

const ownerUser = { ...validUser, email: "owner@example.com" };
const operatorUser = { ...validUser, email: "op@example.com" };
const outsiderUser = { ...validUser, email: "out@example.com" };
const adminUser = { ...validUser, email: "admin@example.com" };

const acme = { slug: "acme", name: "Acme Inc", description: "We sell everything you need." };
const product = {
  name: "Anvil",
  description: "A very heavy anvil.",
  category: "tools",
  priceMinor: 1000,
  currency: "EUR",
  stock: 3,
};

type Headers = Record<string, string>;

describe("seo fields", () => {
  let test: TestApp;
  let app: FastifyInstance;

  beforeEach(async () => {
    await app?.close();
    test = await buildTestApp();
    app = test.app;
  });

  afterAll(async () => {
    await app.close();
  });

  async function bearerFor(
    user: Record<string, unknown>,
    role?: "administrator",
  ): Promise<Headers> {
    await app.inject({ method: "POST", url: "/api/v1/users", payload: user });

    const row = test.repository.rows.find(
      (candidate) => candidate.email === String(user.email).toLowerCase(),
    );

    if (row !== undefined && role !== undefined) {
      row.role = role;
    }

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth",
      payload: { email: user.email, password: user.password },
    });

    return { authorization: `Bearer ${login.json().accessToken}` };
  }

  const call = (
    method: "GET" | "PATCH" | "POST" | "DELETE",
    url: string,
    headers: Headers,
    payload?: Record<string, unknown>,
  ) => app.inject({ method, url: `/api/v1${url}`, headers, payload });

  async function setup() {
    const owner = await bearerFor(ownerUser);
    const operator = await bearerFor(operatorUser);
    const outsider = await bearerFor(outsiderUser);
    const admin = await bearerFor(adminUser, "administrator");
    const vendor = (await call("POST", "/vendors", owner, acme)).json();

    await call("POST", "/vendors/me/operators", owner, { email: operatorUser.email });

    const created = (await call("POST", `/vendors/${vendor.id}/products`, owner, product)).json();

    return { owner, operator, outsider, admin, vendorId: vendor.id, productId: created.id };
  }

  describe("vendor", () => {
    it("starts without seo values", async () => {
      const { owner, vendorId } = await setup();
      const response = await call("GET", `/vendors/${vendorId}`, owner);

      expect(response.json()).toMatchObject({ seoTitle: null, seoDescription: null });
    });

    it("lets the owner and an operator set and clear the fields", async () => {
      const { owner, operator, vendorId } = await setup();

      for (const headers of [owner, operator]) {
        const set = await call("PATCH", `/vendors/${vendorId}`, headers, {
          seoTitle: "  Custom title ",
          seoDescription: "Custom description",
        });

        expect(set.statusCode).toBe(200);
        expect(set.json()).toMatchObject({
          seoTitle: "Custom title",
          seoDescription: "Custom description",
        });

        const cleared = await call("PATCH", `/vendors/${vendorId}`, headers, {
          seoTitle: null,
          seoDescription: "   ",
        });

        expect(cleared.statusCode).toBe(200);
        expect(cleared.json()).toMatchObject({ seoTitle: null, seoDescription: null });
      }
    });

    it("counts null as a present value, so clearing alone is a valid update", async () => {
      const { owner, vendorId } = await setup();
      const response = await call("PATCH", `/vendors/${vendorId}`, owner, { seoTitle: null });

      expect(response.statusCode).toBe(200);
    });

    it("does not touch a field that is left out", async () => {
      const { owner, vendorId } = await setup();

      await call("PATCH", `/vendors/${vendorId}`, owner, { seoTitle: "Title" });

      const response = await call("PATCH", `/vendors/${vendorId}`, owner, {
        seoDescription: "Description",
      });

      expect(response.json()).toMatchObject({ seoTitle: "Title", seoDescription: "Description" });
    });

    it("rejects values over the limits", async () => {
      const { owner, vendorId } = await setup();
      const title = await call("PATCH", `/vendors/${vendorId}`, owner, {
        seoTitle: "a".repeat(SEO_TITLE_MAX + 1),
      });
      const description = await call("PATCH", `/vendors/${vendorId}`, owner, {
        seoDescription: "a".repeat(SEO_DESCRIPTION_MAX + 1),
      });

      expect(title.statusCode).toBe(400);
      expect(description.statusCode).toBe(400);
    });

    it("lets an administrator who is not a member edit them", async () => {
      const { admin, vendorId } = await setup();
      const set = await call("PATCH", `/vendors/${vendorId}`, admin, { seoTitle: "Admin title" });
      const cleared = await call("PATCH", `/vendors/${vendorId}`, admin, { seoTitle: null });

      expect(set.statusCode).toBe(200);
      expect(set.json().seoTitle).toBe("Admin title");
      expect(cleared.json().seoTitle).toBeNull();
    });

    it("keeps the existing 404 for a plain non-member", async () => {
      const { outsider, vendorId } = await setup();
      const response = await call("PATCH", `/vendors/${vendorId}`, outsider, { seoTitle: "Nope" });

      expect(response.statusCode).toBe(404);
    });

    it("returns the fields on the public vendor page", async () => {
      const { owner, vendorId } = await setup();

      await call("PATCH", `/vendors/${vendorId}`, owner, {
        seoTitle: "Public title",
        seoDescription: "Public description",
      });

      const response = await app.inject({ method: "GET", url: "/api/v1/vendors/by-slug/acme" });

      expect(response.json()).toMatchObject({
        seoTitle: "Public title",
        seoDescription: "Public description",
      });
    });
  });

  describe("product", () => {
    async function withImage(productId: string) {
      return test.productsRepository.addImage(productId, { contentType: "image/png", byteSize: 1 });
    }

    it("starts without seo values", async () => {
      const { productId } = await setup();
      const response = await app.inject({ method: "GET", url: `/api/v1/products/${productId}` });

      expect(response.json()).toMatchObject({
        seoTitle: null,
        seoDescription: null,
        seoImageId: null,
      });
    });

    it("can be created with seo text", async () => {
      const { owner, vendorId } = await setup();
      const response = await call("POST", `/vendors/${vendorId}/products`, owner, {
        ...product,
        seoTitle: "Created title",
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toMatchObject({ seoTitle: "Created title", seoDescription: null });
    });

    it("lets a member set and clear the fields", async () => {
      const { operator, productId } = await setup();
      const image = await withImage(productId);
      const set = await call("PATCH", `/products/${productId}`, operator, {
        seoTitle: "Title",
        seoDescription: "Description",
        seoImageId: image.id,
      });

      expect(set.statusCode).toBe(200);
      expect(set.json()).toMatchObject({
        seoTitle: "Title",
        seoDescription: "Description",
        seoImageId: image.id,
      });

      const cleared = await call("PATCH", `/products/${productId}`, operator, {
        seoTitle: "",
        seoDescription: null,
        seoImageId: null,
      });

      expect(cleared.json()).toMatchObject({
        seoTitle: null,
        seoDescription: null,
        seoImageId: null,
      });
    });

    it("lets an administrator who is not a member edit them", async () => {
      const { admin, productId } = await setup();
      const set = await call("PATCH", `/products/${productId}`, admin, { seoTitle: "Admin" });
      const cleared = await call("PATCH", `/products/${productId}`, admin, { seoTitle: null });

      expect(set.json().seoTitle).toBe("Admin");
      expect(cleared.json().seoTitle).toBeNull();
    });

    it("keeps the existing 404 for a plain non-member", async () => {
      const { outsider, productId } = await setup();
      const response = await call("PATCH", `/products/${productId}`, outsider, {
        seoTitle: "Nope",
      });

      expect(response.statusCode).toBe(404);
    });

    it("rejects a seo image that belongs to another product", async () => {
      const { owner, vendorId, productId } = await setup();
      const other = (await call("POST", `/vendors/${vendorId}/products`, owner, product)).json();
      const foreign = await withImage(other.id);
      const response = await call("PATCH", `/products/${productId}`, owner, {
        seoImageId: foreign.id,
      });
      const unknown = await call("PATCH", `/products/${productId}`, owner, {
        seoImageId: "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11",
      });

      expect(response.statusCode).toBe(400);
      expect(unknown.statusCode).toBe(400);
    });

    it("clears the seo image when that image is deleted", async () => {
      const { owner, productId } = await setup();
      const image = await withImage(productId);

      await call("PATCH", `/products/${productId}`, owner, { seoImageId: image.id });

      const removed = await call("DELETE", `/products/${productId}/images/${image.id}`, owner);
      const response = await app.inject({ method: "GET", url: `/api/v1/products/${productId}` });

      expect(removed.statusCode).toBe(204);
      expect(response.json().seoImageId).toBeNull();
    });

    it("returns the fields on the public product", async () => {
      const { owner, productId } = await setup();

      await call("PATCH", `/products/${productId}`, owner, {
        seoTitle: "Public title",
        seoDescription: "Public description",
      });

      const response = await app.inject({ method: "GET", url: `/api/v1/products/${productId}` });

      expect(response.json()).toMatchObject({
        seoTitle: "Public title",
        seoDescription: "Public description",
      });
    });
  });
});
