import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { COUNTRY_CODES } from "../shared/countries.ts";
import { ProblemResponse } from "../shared/problem.ts";
import { CountryListResponse } from "./countries.schemas.ts";

export function countriesController() {
  return async (app: FastifyInstance): Promise<void> => {
    app.withTypeProvider<ZodTypeProvider>().get(
      "/countries",
      {
        schema: {
          tags: ["countries"],
          response: { 200: CountryListResponse, 500: ProblemResponse },
        },
      },
      async () => ({ data: [...COUNTRY_CODES] }),
    );
  };
}
