import { describe, expect, it } from "vitest";

import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX, seoDescription, seoTitle } from "./seo.ts";

describe("seo fields", () => {
  it("trims the value", () => {
    expect(seoTitle.parse("  Hello  ")).toBe("Hello");
    expect(seoDescription.parse("  Hello  ")).toBe("Hello");
  });

  it("turns blank and whitespace-only strings into null", () => {
    expect(seoTitle.parse("")).toBeNull();
    expect(seoTitle.parse("   ")).toBeNull();
    expect(seoDescription.parse("\n\t ")).toBeNull();
  });

  it("keeps null", () => {
    expect(seoTitle.parse(null)).toBeNull();
    expect(seoDescription.parse(null)).toBeNull();
  });

  it("accepts the maximum length and rejects one more", () => {
    expect(seoTitle.safeParse("a".repeat(SEO_TITLE_MAX)).success).toBe(true);
    expect(seoTitle.safeParse("a".repeat(SEO_TITLE_MAX + 1)).success).toBe(false);
    expect(seoDescription.safeParse("a".repeat(SEO_DESCRIPTION_MAX)).success).toBe(true);
    expect(seoDescription.safeParse("a".repeat(SEO_DESCRIPTION_MAX + 1)).success).toBe(false);
  });

  it("measures the length after trimming", () => {
    expect(seoTitle.safeParse(` ${"a".repeat(SEO_TITLE_MAX)} `).success).toBe(true);
  });
});
