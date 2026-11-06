import { unwrap } from "@vendor-hub/api-client";
import type { PutReviewRequest, ReviewListResponse, ReviewResponse } from "@vendor-hub/types";
import { createServerApi } from "../createServerApi.server";

export type ReviewTarget = "product" | "vendor";

export function listProductReviews(
  id: string,
  query: { limit: number; offset: number },
): Promise<ReviewListResponse> {
  return unwrap(
    createServerApi().GET("/api/v1/products/{id}/reviews", {
      params: { path: { id }, query },
    }),
  );
}

export function listVendorReviews(
  slug: string,
  query: { limit: number; offset: number },
): Promise<ReviewListResponse> {
  return unwrap(
    createServerApi().GET("/api/v1/vendors/by-slug/{slug}/reviews", {
      params: { path: { slug }, query },
    }),
  );
}

export function saveReview(
  token: string,
  target: ReviewTarget,
  id: string,
  body: PutReviewRequest,
): Promise<ReviewResponse> {
  const api = createServerApi(token);

  return target === "product"
    ? unwrap(api.PUT("/api/v1/products/{id}/reviews/me", { params: { path: { id } }, body }))
    : unwrap(api.PUT("/api/v1/vendors/{id}/reviews/me", { params: { path: { id } }, body }));
}

export async function deleteReview(
  token: string,
  target: ReviewTarget,
  id: string,
  reviewId: string,
): Promise<void> {
  const api = createServerApi(token);
  const path = { id, reviewId };

  if (target === "product") {
    await unwrap(api.DELETE("/api/v1/products/{id}/reviews/{reviewId}", { params: { path } }));
  } else {
    await unwrap(api.DELETE("/api/v1/vendors/{id}/reviews/{reviewId}", { params: { path } }));
  }
}
