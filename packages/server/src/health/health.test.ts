import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildTestApp } from "../testing/build-test-app.ts";
import { HealthResponse } from "./health.schemas.ts";

describe("GET /health", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    ({ app } = await buildTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 with status ok", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(HealthResponse.parse(response.json())).toEqual({ status: "ok" });
  });

  it("returns 503 problem+json when the database is down", async () => {
    const { app: broken } = await buildTestApp(async () => {
      throw new Error("down");
    });
    const response = await broken.inject({ method: "GET", url: "/health" });

    await broken.close();

    expect(response.statusCode).toBe(503);
    expect(response.headers["content-type"]).toContain("application/problem+json");
  });
});
