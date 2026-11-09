import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { ProblemResponse } from "../shared/problem.ts";
import {
  InsightsDetailQuery,
  InsightsProductParams,
  InsightsVendorListQuery,
  InsightsVendorListResponse,
  InsightsVendorParams,
  ProductInsightsResponse,
  VendorInsightsResponse,
} from "./insights.schemas.ts";
import type { InsightsService } from "./insights.service.ts";

const security = [{ bearerAuth: [] }];

const errors = { 400: ProblemResponse, 401: ProblemResponse, 404: ProblemResponse };

export function insightsController(service: InsightsService) {
  return async (app: FastifyInstance): Promise<void> => {
    const typed = app.withTypeProvider<ZodTypeProvider>();

    typed.get(
      "/insights/vendors",
      {
        schema: {
          tags: ["insights"],
          security,
          querystring: InsightsVendorListQuery,
          response: {
            200: InsightsVendorListResponse,
            400: ProblemResponse,
            401: ProblemResponse,
          },
        },
      },
      async (request) => {
        const { items, total, meta, hasPrevious } = await service.listVendors(
          request.auth,
          request.query,
        );

        return {
          data: items.map((item) => ({
            ...item,
            previousNetMinor: hasPrevious ? item.previousNetMinor : null,
          })),
          meta: { total, limit: request.query.limit, offset: request.query.offset, ...meta },
        };
      },
    );

    typed.get(
      "/insights/vendors/:id",
      {
        schema: {
          tags: ["insights"],
          security,
          params: InsightsVendorParams,
          querystring: InsightsDetailQuery,
          response: { 200: VendorInsightsResponse, ...errors },
        },
      },
      (request) => service.vendorInsights(request.auth, request.params.id, request.query),
    );

    typed.get(
      "/insights/products/:id",
      {
        schema: {
          tags: ["insights"],
          security,
          params: InsightsProductParams,
          querystring: InsightsDetailQuery,
          response: { 200: ProductInsightsResponse, ...errors },
        },
      },
      (request) => service.productInsights(request.auth, request.params.id, request.query),
    );
  };
}
