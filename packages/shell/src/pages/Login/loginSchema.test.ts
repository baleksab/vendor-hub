import { describe, expect, it } from "vitest";

import { loginSchema } from "./loginSchema";

describe("loginSchema", () => {
  it("normalizes email and only requires a password", () => {
    expect(loginSchema.parse({ email: " A@B.io ", password: "x" })).toEqual({
      email: "a@b.io",
      password: "x",
    });
  });

  it("rejects an empty password and a bad email", () => {
    const result = loginSchema.safeParse({ email: "nope", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      "validation.email",
      "validation.required",
    ]);
  });
});
