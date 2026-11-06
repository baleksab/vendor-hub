import { beforeEach, describe, expect, it, vi } from "vitest";

import { authedForm, failure, ok, outcome } from "../testing/actions";

const api = vi.hoisted(() => ({ GET: vi.fn(), PUT: vi.fn(), DELETE: vi.fn() }));

vi.mock("../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { reviewAction } = await import("./reviewAction.server");

const ID = "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11";
const REVIEW_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const URL = "http://shell.test/vendors/acme";

const submit = async (values: Record<string, string>) =>
  outcome(reviewAction(await authedForm(values, URL)));

beforeEach(() => {
  vi.resetAllMocks();
  api.GET.mockResolvedValue(ok({ id: "u1", role: "regular" }));
});

describe("reviewAction", () => {
  it("saves a product review with an empty comment as null", async () => {
    api.PUT.mockResolvedValueOnce(ok({}));

    const result = await submit({
      intent: "saveProductReview",
      targetId: ID,
      rating: "4",
      comment: "  ",
    });

    expect(result).toEqual({ ok: true });

    const [path, options] = api.PUT.mock.calls[0] as [string, { body: unknown }];

    expect(path).toBe("/api/v1/products/{id}/reviews/me");
    expect(options.body).toEqual({ rating: 4, comment: null });
  });

  it("uses the vendor route for vendor reviews", async () => {
    api.PUT.mockResolvedValueOnce(ok({}));

    await submit({ intent: "saveVendorReview", targetId: ID, rating: "5", comment: "Great" });

    expect(api.PUT.mock.calls[0]?.[0]).toBe("/api/v1/vendors/{id}/reviews/me");
  });

  it("rejects an invalid rating before calling the API", async () => {
    const result = (await submit({
      intent: "saveProductReview",
      targetId: ID,
      rating: "7",
      comment: "",
    })) as { data: { fields: Record<string, string> }; init: { status: number } };

    expect(result.init.status).toBe(400);
    expect(result.data.fields.rating).toBe("review.validation.rating");
    expect(api.PUT).not.toHaveBeenCalled();
  });

  it("shows the own vendor message on 403", async () => {
    api.PUT.mockResolvedValueOnce(failure(403, "Forbidden"));

    const result = (await submit({
      intent: "saveProductReview",
      targetId: ID,
      rating: "5",
      comment: "",
    })) as { data: { form: string }; init: { status: number } };

    expect(result.init.status).toBe(403);
    expect(result.data.form).toBe("review.error.ownVendor");
  });

  it("deletes a review", async () => {
    api.DELETE.mockResolvedValueOnce(ok(null, 204));

    const result = await submit({
      intent: "deleteProductReview",
      targetId: ID,
      reviewId: REVIEW_ID,
    });

    expect(result).toEqual({ ok: true });
    expect(api.DELETE.mock.calls[0]?.[0]).toBe("/api/v1/products/{id}/reviews/{reviewId}");
  });

  it("answers 400 for an unknown intent", async () => {
    await expect(submit({ intent: "nope" })).rejects.toMatchObject({ init: { status: 400 } });
  });
});
