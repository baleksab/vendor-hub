import { describe, expect, it } from "vitest";

import { becomeVendorSchema } from "./becomeVendorSchema";

const valid = { slug: "acme", name: "Acme Inc", description: "We sell everything you need." };

describe("becomeVendorSchema", () => {
  it("accepts valid values and normalizes the slug", () => {
    const result = becomeVendorSchema.safeParse({ ...valid, slug: " Acme-Shop " });

    expect(result.success && result.data.slug).toBe("acme-shop");
  });

  it.each(["ab", "-acme", "acme-", "ac--me", "ac me", "a".repeat(41), "ačme"])(
    "rejects the slug %s",
    (slug) => {
      const result = becomeVendorSchema.safeParse({ ...valid, slug });

      expect(result.error?.issues[0]?.message).toBe("validation.slug");
    },
  );

  it("rejects a short name and a short or long description", () => {
    const short = becomeVendorSchema.safeParse({ ...valid, name: "A", description: "short" });
    const long = becomeVendorSchema.safeParse({ ...valid, description: "x".repeat(1001) });

    expect(short.error?.issues.map((issue) => issue.message)).toEqual([
      "validation.tooShort",
      "validation.tooShort",
    ]);
    expect(long.error?.issues[0]?.message).toBe("validation.tooLong");
  });
});
