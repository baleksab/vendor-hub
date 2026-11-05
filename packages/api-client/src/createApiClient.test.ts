import { describe, expect, it } from "vitest";

import { ApiError } from "./ApiError";
import { unwrap } from "./createApiClient";

const response = (status: number, statusText = "") => new Response(null, { status, statusText });

describe("unwrap", () => {
  it("returns the data of a successful call", async () => {
    await expect(
      unwrap(Promise.resolve({ data: { id: 1 }, response: response(200) })),
    ).resolves.toEqual({
      id: 1,
    });
  });

  it("returns undefined for an empty success (204)", async () => {
    await expect(unwrap(Promise.resolve({ response: response(204) }))).resolves.toBeUndefined();
  });

  it("throws an ApiError built from the problem body", async () => {
    const error = { title: "Conflict", status: 409, detail: "Email taken" };

    await expect(
      unwrap(Promise.resolve({ error, response: response(409, "Conflict") })),
    ).rejects.toMatchObject({ kind: "conflict", detail: "Email taken" });
  });

  it("turns a rejected fetch into a network ApiError", async () => {
    const rejected = unwrap(Promise.reject(new TypeError("fetch failed")));

    await expect(rejected).rejects.toBeInstanceOf(ApiError);
    await expect(rejected).rejects.toMatchObject({ kind: "network", status: 0 });
  });
});
