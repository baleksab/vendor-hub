import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { ProblemResponse } from "../shared/problem.ts";
import { CATEGORY_TREE } from "./categories.ts";
import { CategoryListResponse } from "./categories.schemas.ts";

export function categoriesController() {
  return async (app: FastifyInstance): Promise<void> => {
    app.withTypeProvider<ZodTypeProvider>().get(
      "/categories",
      {
        schema: {
          tags: ["categories"],
          response: { 200: CategoryListResponse, 500: ProblemResponse },
        },
      },
      async () => ({ data: [...CATEGORY_TREE] }),
    );
  };
}
