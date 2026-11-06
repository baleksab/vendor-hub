import { describe, expect, it } from "vitest";

import { createQueryClient } from "./createQueryClient";

describe("createQueryClient", () => {
  const retry = createQueryClient().getDefaultOptions().queries?.retry as (
    failureCount: number,
    error: unknown,
  ) => boolean;

  it("retries a failing query a limited number of times", () => {
    expect(retry(0, new Error("network"))).toBe(true);
    expect(retry(2, new Error("network"))).toBe(false);
  });

  it.each([401, 403, 404])("does not retry a %s", (status) => {
    expect(retry(0, { status })).toBe(false);
  });

  it("retries a server error", () => {
    expect(retry(0, { status: 500 })).toBe(true);
  });

  it("gives every call its own client", () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});
