import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildTestApp } from "./testing/build-test-app.ts";

const UNVERSIONED = new Set(["/health", "/swagger/schema.json"]);

describe("OpenAPI document", () => {
  let app: FastifyInstance;
  let document: {
    paths: Record<string, unknown>;
    components: { schemas: Record<string, unknown> };
  };

  beforeAll(async () => {
    ({ app } = await buildTestApp());
    document = (await app.inject({ method: "GET", url: "/swagger/schema.json" })).json();
  });

  afterAll(async () => {
    await app.close();
  });

  it("keeps every business route under /api/v1", () => {
    const outside = Object.keys(document.paths).filter(
      (path) => !path.startsWith("/api/v1/") && !UNVERSIONED.has(path) && !path.startsWith("/docs"),
    );

    expect(outside).toEqual([]);
  });

  it("lists the expected routes", () => {
    expect(Object.keys(document.paths).sort()).toEqual([
      "/api/v1/auth",
      "/api/v1/cart/quote",
      "/api/v1/categories",
      "/api/v1/countries",
      "/api/v1/insights/products/{id}",
      "/api/v1/insights/vendors",
      "/api/v1/insights/vendors/{id}",
      "/api/v1/orders",
      "/api/v1/orders/{id}",
      "/api/v1/orders/{id}/cancel",
      "/api/v1/orders/{id}/confirm-receipt",
      "/api/v1/orders/{id}/deliver",
      "/api/v1/orders/{id}/payments",
      "/api/v1/orders/{id}/return-requests",
      "/api/v1/orders/{id}/returns/approve",
      "/api/v1/orders/{id}/returns/reject",
      "/api/v1/product-images/{id}",
      "/api/v1/products/{id}",
      "/api/v1/products/{id}/images",
      "/api/v1/products/{id}/images/order",
      "/api/v1/products/{id}/images/{imageId}",
      "/api/v1/products/{id}/reviews",
      "/api/v1/products/{id}/reviews/me",
      "/api/v1/products/{id}/reviews/{reviewId}",
      "/api/v1/users",
      "/api/v1/users/me",
      "/api/v1/users/{id}",
      "/api/v1/vendors",
      "/api/v1/vendors/by-slug/{slug}",
      "/api/v1/vendors/by-slug/{slug}/product-categories",
      "/api/v1/vendors/by-slug/{slug}/products",
      "/api/v1/vendors/by-slug/{slug}/reviews",
      "/api/v1/vendors/managed",
      "/api/v1/vendors/me",
      "/api/v1/vendors/me/operators",
      "/api/v1/vendors/me/operators/{userId}",
      "/api/v1/vendors/{id}",
      "/api/v1/vendors/{id}/operators",
      "/api/v1/vendors/{id}/operators/{userId}",
      "/api/v1/vendors/{id}/orders",
      "/api/v1/vendors/{id}/products",
      "/api/v1/vendors/{id}/reviews/me",
      "/api/v1/vendors/{id}/reviews/{reviewId}",
      "/health",
    ]);
  });

  it("has no password or hash field in the response schemas", () => {
    for (const name of ["UserResponse", "UserListResponse", "TokenResponse"]) {
      expect(JSON.stringify(document.components.schemas[name])).not.toMatch(/password|hash/i);
    }
  });
});
