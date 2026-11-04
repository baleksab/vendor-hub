import fastifySwagger from "@fastify/swagger";
import Fastify, { type FastifyInstance } from "fastify";
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import type { JwtEnv } from "../env.ts";
import { AuthService } from "./auth/auth.service.ts";
import { Argon2PasswordService } from "./auth/password.service.ts";
import { TokenService } from "./auth/token.service.ts";
import { healthController, type DatabaseCheck } from "./health/health.controller.ts";
import { registerProblemHandler } from "./shared/problem.ts";
import { swaggerController } from "./swagger/swagger.controller.ts";
import type { UsersRepository } from "./users/users.repository.ts";
import { UsersService } from "./users/users.service.ts";
import { v1 } from "./v1.ts";

export type AppOptions = {
  logger: boolean;
  jwt: JwtEnv;
  usersRepository: UsersRepository;
  checkDatabase: DatabaseCheck;
};

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger
      ? {
          redact: {
            paths: ["req.headers.authorization", "req.body.password"],
            censor: "[redacted]",
          },
        }
      : false,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerProblemHandler(app);

  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.1.0",
      info: { title: "Vendor Hub API", version: "0.0.0" },
      components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      },
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });

  const passwords = new Argon2PasswordService();
  const tokens = new TokenService(options.jwt);
  const usersService = new UsersService(options.usersRepository, passwords);
  const authService = new AuthService(options.usersRepository, passwords, tokens);

  await app.register(swaggerController);
  await app.register(healthController(options.checkDatabase));
  await app.register(v1({ usersService, authService, tokens }), { prefix: "/api/v1" });

  return app;
}
