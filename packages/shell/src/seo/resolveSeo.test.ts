import { describe, expect, it } from "vitest";

import { DESCRIPTION_MAX, resolveProductSeo, resolveVendorSeo } from "./resolveSeo";

const vendor = { name: "Acme", description: "x".repeat(DESCRIPTION_MAX + 40) };
const images = [{ id: "first" }, { id: "second" }];
const product = { description: "y".repeat(DESCRIPTION_MAX + 40), images };
const FALLBACK_TITLE = "Anvil - Acme";

describe("resolveVendorSeo", () => {
  it("falls back to the name and the cut description when nothing is set", () => {
    expect(resolveVendorSeo(vendor)).toEqual({
      title: "Acme",
      description: "x".repeat(DESCRIPTION_MAX),
    });
    expect(resolveVendorSeo({ ...vendor, seoTitle: null, seoDescription: null })).toEqual({
      title: "Acme",
      description: "x".repeat(DESCRIPTION_MAX),
    });
  });

  it("uses only the title when only the title is set", () => {
    expect(resolveVendorSeo({ ...vendor, seoTitle: "Custom" })).toEqual({
      title: "Custom",
      description: "x".repeat(DESCRIPTION_MAX),
    });
  });

  it("uses only the description when only the description is set", () => {
    expect(resolveVendorSeo({ ...vendor, seoDescription: "Custom text" })).toEqual({
      title: "Acme",
      description: "Custom text",
    });
  });

  it("uses both when both are set, as they are", () => {
    expect(
      resolveVendorSeo({ ...vendor, seoTitle: "Custom", seoDescription: "Custom text" }),
    ).toEqual({ title: "Custom", description: "Custom text" });
  });

  it("treats a blank string as not set", () => {
    expect(resolveVendorSeo({ ...vendor, seoTitle: "   ", seoDescription: "" })).toEqual({
      title: "Acme",
      description: "x".repeat(DESCRIPTION_MAX),
    });
  });
});

describe("resolveProductSeo", () => {
  it("falls back to the title, the cut description and the first image", () => {
    expect(resolveProductSeo(product, FALLBACK_TITLE)).toEqual({
      title: FALLBACK_TITLE,
      description: "y".repeat(DESCRIPTION_MAX),
      imageId: "first",
    });
  });

  it("uses each custom field on its own", () => {
    expect(resolveProductSeo({ ...product, seoTitle: "Custom" }, FALLBACK_TITLE).title).toBe(
      "Custom",
    );
    expect(
      resolveProductSeo({ ...product, seoDescription: "Custom text" }, FALLBACK_TITLE),
    ).toMatchObject({ title: FALLBACK_TITLE, description: "Custom text", imageId: "first" });
    expect(resolveProductSeo({ ...product, seoImageId: "second" }, FALLBACK_TITLE)).toMatchObject({
      title: FALLBACK_TITLE,
      imageId: "second",
    });
  });

  it("uses all custom values when all are set", () => {
    expect(
      resolveProductSeo(
        { ...product, seoTitle: "Custom", seoDescription: "Custom text", seoImageId: "second" },
        FALLBACK_TITLE,
      ),
    ).toEqual({ title: "Custom", description: "Custom text", imageId: "second" });
  });

  it("falls back to the first image for an unknown image id", () => {
    expect(resolveProductSeo({ ...product, seoImageId: "gone" }, FALLBACK_TITLE).imageId).toBe(
      "first",
    );
  });

  it("has no image when the product has none", () => {
    expect(
      resolveProductSeo({ ...product, images: [], seoImageId: "gone" }, FALLBACK_TITLE).imageId,
    ).toBeUndefined();
  });

  it("treats a blank string as not set", () => {
    expect(
      resolveProductSeo({ ...product, seoTitle: "  ", seoDescription: " " }, FALLBACK_TITLE),
    ).toMatchObject({ title: FALLBACK_TITLE, description: "y".repeat(DESCRIPTION_MAX) });
  });
});
