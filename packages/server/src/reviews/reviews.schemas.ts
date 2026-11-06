import { z } from "zod";

import { PageMeta, PaginationQuery } from "../shared/pagination.ts";

export const REVIEW_COMMENT_MAX_LENGTH = 1000;

export const PutReviewRequest = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z
      .string()
      .trim()
      .max(REVIEW_COMMENT_MAX_LENGTH)
      .nullish()
      .transform((value) => (value === undefined || value === null || value === "" ? null : value)),
  })
  .meta({ id: "PutReviewRequest" });

export const ReviewResponse = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    authorName: z.string(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "ReviewResponse" });

export const ReviewSummaryResponse = z
  .object({
    ratingAvg: z.number(),
    ratingCount: z.number().int(),
    distribution: z.array(z.number().int()).length(5),
  })
  .meta({ id: "ReviewSummaryResponse" });

export const ReviewListResponse = z
  .object({
    data: z.array(ReviewResponse),
    meta: PageMeta,
    summary: ReviewSummaryResponse,
  })
  .meta({ id: "ReviewListResponse" });

export const ListReviewsQuery = PaginationQuery;

export const TargetIdParams = z.object({ id: z.uuid() });

export const TargetReviewParams = z.object({ id: z.uuid(), reviewId: z.uuid() });

export type PutReviewRequest = z.infer<typeof PutReviewRequest>;
export type ListReviewsQuery = z.infer<typeof ListReviewsQuery>;
