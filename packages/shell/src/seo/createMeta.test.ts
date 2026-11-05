import { describe, expect, it } from "vitest";

import { createPageMeta, type PageMetaInput } from "./createMeta";

const input: PageMetaInput = {
  title: "Title",
  description: "Description",
  path: "/remote-test",
  origin: "https://example.com",
  locale: "sr",
  siteName: "Site",
};

describe("createPageMeta", () => {
  it("builds title and description", () => {
    const meta = createPageMeta(input);

    expect(meta).toContainEqual({ title: "Title" });
    expect(meta).toContainEqual({ name: "description", content: "Description" });
  });

  it("builds an absolute canonical link", () => {
    expect(createPageMeta(input)).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: "https://example.com/remote-test",
    });
  });

  it("builds open graph and twitter tags", () => {
    const meta = createPageMeta(input);

    expect(meta).toContainEqual({ property: "og:title", content: "Title" });
    expect(meta).toContainEqual({ property: "og:description", content: "Description" });
    expect(meta).toContainEqual({ property: "og:type", content: "website" });
    expect(meta).toContainEqual({ property: "og:url", content: "https://example.com/remote-test" });
    expect(meta).toContainEqual({ property: "og:site_name", content: "Site" });
    expect(meta).toContainEqual({ property: "og:locale", content: "sr_RS" });
    expect(meta).toContainEqual({ name: "twitter:card", content: "summary" });
  });

  it("adds robots noindex without a canonical link when asked", () => {
    const robots = { name: "robots", content: "noindex" };
    const noindexed = createPageMeta({ ...input, noindex: true });

    expect(createPageMeta(input)).not.toContainEqual(robots);
    expect(noindexed).toContainEqual(robots);
    expect(noindexed.some((entry) => "rel" in entry && entry.rel === "canonical")).toBe(false);
  });
});
