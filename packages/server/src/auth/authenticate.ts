import type { FastifyInstance } from "fastify";

import { UnauthorizedError } from "../shared/errors.ts";
import type { AuthContext, TokenService } from "./token.service.ts";

declare module "fastify" {
  interface FastifyRequest {
    auth: AuthContext;
  }
}

const BEARER_PREFIX = "Bearer ";

export function authenticate(app: FastifyInstance, tokens: TokenService): void {
  app.addHook("onRequest", async (request) => {
    const header = request.headers.authorization;

    if (header === undefined || !header.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedError("Missing bearer token");
    }

    request.auth = await tokens.verify(header.slice(BEARER_PREFIX.length));
  });
}
