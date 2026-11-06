import type { Review, ReviewSummary } from "./review.ts";

export function toReviewResponse(review: Review) {
  return {
    id: review.id,
    userId: review.userId,
    authorName: `${review.authorFirstName} ${review.authorLastName.charAt(0)}.`,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

export function toSummaryResponse(summary: ReviewSummary) {
  const ratingCount = summary.distribution.reduce((sum, value) => sum + value, 0);
  const weighted = summary.distribution.reduce((sum, value, index) => sum + value * (index + 1), 0);

  return {
    ratingAvg: ratingCount === 0 ? 0 : Math.round((weighted / ratingCount) * 100) / 100,
    ratingCount,
    distribution: summary.distribution,
  };
}
