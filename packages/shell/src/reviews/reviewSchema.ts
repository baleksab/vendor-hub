import { z } from "zod";

import { message } from "../forms/fields";

export const REVIEW_COMMENT_MAX = 1000;

export const reviewSchema = z.object({
  targetId: z.uuid(),
  rating: z.coerce
    .number(message("review.validation.rating"))
    .int(message("review.validation.rating"))
    .min(1, message("review.validation.rating"))
    .max(5, message("review.validation.rating")),
  comment: z.string().trim().max(REVIEW_COMMENT_MAX, message("validation.tooLong")),
});

export const deleteReviewSchema = z.object({ targetId: z.uuid(), reviewId: z.uuid() });
