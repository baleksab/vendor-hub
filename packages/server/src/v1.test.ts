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
      "/api/v1/countries",
      "/api/v1/users",
      "/api/v1/users/me",
      "/api/v1/users/{id}",
      "/api/v1/vendors",
      "/api/v1/vendors/by-slug/{slug}",
      "/api/v1/vendors/managed",
      "/api/v1/vendors/me",
      "/api/v1/vendors/me/operators",
      "/api/v1/vendors/me/operators/{userId}",
      "/api/v1/vendors/{id}",
      "/api/v1/vendors/{id}/operators",
      "/api/v1/vendors/{id}/operators/{userId}",
      "/health",
    ]);
  });

  it("has no password or hash field in the response schemas", () => {
    for (const name of ["UserResponse", "UserListResponse", "TokenResponse"]) {
      expect(JSON.stringify(document.components.schemas[name])).not.toMatch(/password|hash/i);
    }
  });
});
