import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../app.ts";

describe("GET /swagger/schema.json", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns an OpenAPI 3.1 document that lists /health", async () => {
    const response = await app.inject({ method: "GET", url: "/swagger/schema.json" });
    const document = response.json();

    expect(response.statusCode).toBe(200);
    expect(document.openapi).toMatch(/^3\.1\./);
    expect(document.paths["/health"].get.responses["200"]).toBeDefined();
  });

  it("serves Swagger UI at /docs", async () => {
    const response = await app.inject({ method: "GET", url: "/docs/" });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
  });

  it("does not list itself", async () => {
    const response = await app.inject({ method: "GET", url: "/swagger/schema.json" });

    expect(response.json().paths["/swagger/schema.json"]).toBeUndefined();
  });
});
