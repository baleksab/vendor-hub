import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { ServiceUnavailableError } from "../shared/errors.ts";
import { ProblemResponse } from "../shared/problem.ts";
import { HealthResponse } from "./health.schemas.ts";

export type DatabaseCheck = () => Promise<void>;

export function healthController(checkDatabase: DatabaseCheck) {
  return async (app: FastifyInstance): Promise<void> => {
    app.withTypeProvider<ZodTypeProvider>().get(
      "/health",
      {
        schema: {
          response: { 200: HealthResponse, 503: ProblemResponse },
        },
      },
      async () => {
        try {
          await checkDatabase();
        } catch {
          throw new ServiceUnavailableError("Database is not reachable");
        }

        return { status: "ok" as const };
      },
    );
  };
}
