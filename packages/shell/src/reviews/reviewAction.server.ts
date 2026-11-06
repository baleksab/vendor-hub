import { data } from "react-router";

import { deleteReview, saveReview, type ReviewTarget } from "../api/endpoints/reviews.server";
import { assertSameOrigin } from "../auth/sameOrigin.server";
import { requireUser } from "../auth/session.server";
import { failed, invalid, readValues } from "../forms/formErrors.server";
import { deleteReviewSchema, reviewSchema } from "./reviewSchema";

const INTENTS: Record<string, { target: ReviewTarget; kind: "save" | "delete" }> = {
  saveProductReview: { target: "product", kind: "save" },
  deleteProductReview: { target: "product", kind: "delete" },
  saveVendorReview: { target: "vendor", kind: "save" },
  deleteVendorReview: { target: "vendor", kind: "delete" },
};

const BAD_REQUEST = 400;

export async function reviewAction(request: Request) {
  assertSameOrigin(request);

  const session = await requireUser(request);
  const values = await readValues(request);
  const intent = INTENTS[values.intent ?? ""];

  if (intent === undefined) {
    throw data(null, { status: BAD_REQUEST });
  }

  try {
    if (intent.kind === "delete") {
      const parsed = deleteReviewSchema.safeParse(values);

      if (!parsed.success) {
        throw data(null, { status: BAD_REQUEST });
      }

      await deleteReview(session.token, intent.target, parsed.data.targetId, parsed.data.reviewId);

      return { ok: true as const };
    }

    const parsed = reviewSchema.safeParse(values);

    if (!parsed.success) {
      return invalid(parsed.error, values);
    }

    await saveReview(session.token, intent.target, parsed.data.targetId, {
      rating: parsed.data.rating,
      comment: parsed.data.comment === "" ? null : parsed.data.comment,
    });

    return { ok: true as const };
  } catch (error) {
    if (
      error instanceof Response ||
      (typeof error === "object" && error !== null && "init" in error)
    ) {
      throw error;
    }

    return failed(error, "review", values);
  }
}
