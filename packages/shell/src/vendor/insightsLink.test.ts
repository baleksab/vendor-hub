import { describe, expect, it } from "vitest";

import { hasInsights, insightsProductPath, insightsVendorPath } from "./insightsLink";

const owned = {
  id: "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11",
  slug: "acme",
  name: "Acme",
  description: "d",
  members: [],
  viewerRole: "owner" as const,
  memberRole: "owner" as const,
  canDelete: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("hasInsights", () => {
  it("is false without a session or vendors", () => {
    expect(hasInsights(null)).toBe(false);
    expect(hasInsights({ owned: null, operating: [] })).toBe(false);
  });

  it("is true for an owner or an operator", () => {
    expect(hasInsights({ owned, operating: [] })).toBe(true);
    expect(hasInsights({ owned: null, operating: [{ slug: "acme", name: "Acme" }] })).toBe(true);
  });
});

describe("insights paths", () => {
  it("builds vendor and product paths", () => {
    expect(insightsVendorPath("v1")).toBe("/insights/vendors/v1");
    expect(insightsProductPath("v1", "p1")).toBe("/insights/vendors/v1/products/p1");
  });
});
