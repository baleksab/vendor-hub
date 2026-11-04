import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { HealthResponse } from "./health.schemas.ts";

export async function healthController(app: FastifyInstance): Promise<void> {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/health",
    {
      schema: {
        response: { 200: HealthResponse },
      },
    },
    async () => ({ status: "ok" as const }),
  );
}
