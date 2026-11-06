import { describe, expect, it } from "vitest";

import { buildRobots } from "./robots";

describe("buildRobots", () => {
  it("allows crawling and points to the sitemap on the given origin", () => {
    const robots = buildRobots("https://example.com");

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("blocks the locale endpoint", () => {
    expect(buildRobots("https://example.com")).toContain("Disallow: /locale");
  });

  it.each(["/cart", "/checkout", "/orders"])("blocks %s", (path) => {
    expect(buildRobots("https://example.com")).toContain(`Disallow: ${path}`);
  });
});
