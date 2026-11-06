import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { ProblemResponse } from "../shared/problem.ts";
import { VendorSlugParams } from "../vendors/vendors.schemas.ts";
import { toReviewResponse, toSummaryResponse } from "./reviews.mapper.ts";
import {
  ListReviewsQuery,
  PutReviewRequest,
  ReviewListResponse,
  ReviewResponse,
  TargetIdParams,
  TargetReviewParams,
} from "./reviews.schemas.ts";
import type { ReviewPage, ReviewsService } from "./reviews.service.ts";

const security = [{ bearerAuth: [] }];

function toListResponse(page: ReviewPage, query: { limit: number; offset: number }) {
  return {
    data: page.items.map(toReviewResponse),
    meta: { total: page.total, limit: query.limit, offset: query.offset },
    summary: toSummaryResponse(page.summary),
  };
}

export function publicReviewsController(service: ReviewsService) {
  return async (app: FastifyInstance): Promise<void> => {
    const typed = app.withTypeProvider<ZodTypeProvider>();

    typed.get(
      "/products/:id/reviews",
      {
        schema: {
          tags: ["reviews"],
          params: TargetIdParams,
          querystring: ListReviewsQuery,
          response: { 200: ReviewListResponse, 400: ProblemResponse, 404: ProblemResponse },
        },
      },
      async (request) =>
        toListResponse(
          await service.listForProduct(request.params.id, request.query),
          request.query,
        ),
    );

    typed.get(
      "/vendors/by-slug/:slug/reviews",
      {
        schema: {
          tags: ["reviews"],
          params: VendorSlugParams,
          querystring: ListReviewsQuery,
          response: { 200: ReviewListResponse, 400: ProblemResponse, 404: ProblemResponse },
        },
      },
      async (request) =>
        toListResponse(
          await service.listForVendorSlug(request.params.slug, request.query),
          request.query,
        ),
    );
  };
}

export function reviewsController(service: ReviewsService) {
  return async (app: FastifyInstance): Promise<void> => {
    const typed = app.withTypeProvider<ZodTypeProvider>();

    for (const [target, base] of [
      ["product", "products"],
      ["vendor", "vendors"],
    ] as const) {
      typed.put(
        `/${base}/:id/reviews/me`,
        {
          schema: {
            tags: ["reviews"],
            security,
            params: TargetIdParams,
            body: PutReviewRequest,
            response: {
              200: ReviewResponse,
              400: ProblemResponse,
              401: ProblemResponse,
              403: ProblemResponse,
              404: ProblemResponse,
            },
          },
        },
        async (request) =>
          toReviewResponse(
            await service.put(target, request.params.id, request.auth, request.body),
          ),
      );

      typed.delete(
        `/${base}/:id/reviews/:reviewId`,
        {
          schema: {
            tags: ["reviews"],
            security,
            params: TargetReviewParams,
            response: {
              204: z.null(),
              400: ProblemResponse,
              401: ProblemResponse,
              404: ProblemResponse,
            },
          },
        },
        async (request, reply) => {
          await service.delete(target, request.params.id, request.auth, request.params.reviewId);

          return reply.status(204).send(null);
        },
      );
    }
  };
}
