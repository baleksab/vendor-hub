import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";

import { COUNTRY_CODES } from "../shared/countries.ts";
import { buildTestApp } from "../testing/build-test-app.ts";
import { CountryListResponse } from "./countries.schemas.ts";

describe("GET /api/v1/countries", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    ({ app } = await buildTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it("is public and returns every supported country code", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1/countries" });

    expect(response.statusCode).toBe(200);
    expect(CountryListResponse.parse(response.json()).data).toEqual([...COUNTRY_CODES]);
  });
});
