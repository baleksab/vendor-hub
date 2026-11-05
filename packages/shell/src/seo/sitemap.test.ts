import { describe, expect, it } from "vitest";

import { buildSitemap } from "./sitemap";

describe("buildSitemap", () => {
  it("lists every path as an absolute url on the origin", () => {
    const sitemap = buildSitemap("https://example.com", ["/", "/vendors"]);

    expect(sitemap).toContain("<loc>https://example.com/</loc>");
    expect(sitemap).toContain("<loc>https://example.com/vendors</loc>");
  });

  it("is a urlset document with an xml declaration", () => {
    const sitemap = buildSitemap("https://example.com", ["/"]);

    expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain("</urlset>");
  });

  it("escapes special characters in urls", () => {
    const sitemap = buildSitemap("https://example.com", ["/a?x=1&y=2"]);

    expect(sitemap).toContain("<loc>https://example.com/a?x=1&amp;y=2</loc>");
    expect(sitemap).not.toContain("x=1&y=2");
  });
});
