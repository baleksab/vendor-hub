import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export async function swaggerController(app: FastifyInstance): Promise<void> {
  await app.register(fastifySwaggerUi, { routePrefix: "/docs" });

  app.get("/swagger/schema.json", { schema: { hide: true } }, async () => app.swagger());
}
