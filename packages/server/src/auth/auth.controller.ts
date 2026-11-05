import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { ProblemResponse } from "../shared/problem.ts";
import { LoginRequest, TokenResponse } from "./auth.schemas.ts";
import type { AuthService } from "./auth.service.ts";

export function authController(service: AuthService) {
  return async (app: FastifyInstance): Promise<void> => {
    app.withTypeProvider<ZodTypeProvider>().post(
      "/auth",
      {
        schema: {
          tags: ["auth"],
          body: LoginRequest,
          response: { 200: TokenResponse, 400: ProblemResponse, 401: ProblemResponse },
        },
      },
      async (request) => service.login(request.body),
    );
  };
}
