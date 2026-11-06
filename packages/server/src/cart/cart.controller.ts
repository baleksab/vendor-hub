import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { ProblemResponse } from "../shared/problem.ts";
import { CartQuoteRequest, CartQuoteResponse } from "./cart.schemas.ts";
import type { CartService } from "./cart.service.ts";

export function cartController(service: CartService) {
  return async (app: FastifyInstance): Promise<void> => {
    const typed = app.withTypeProvider<ZodTypeProvider>();

    typed.post(
      "/cart/quote",
      {
        schema: {
          tags: ["cart"],
          body: CartQuoteRequest,
          response: { 200: CartQuoteResponse, 400: ProblemResponse },
        },
      },
      async (request) => service.quote(request.body.lines),
    );
  };
}
