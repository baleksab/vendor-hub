import { describe, expect, it } from "vitest";

import { manageVendorsLabelKey } from "./manageVendorsLink";

const owned = {
  id: "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11",
  slug: "acme",
  name: "Acme",
  description: "d",
  members: [],
  viewerRole: "owner" as const,
  canDelete: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("manageVendorsLabelKey", () => {
  it("shows nothing to an anonymous visitor", () => {
    expect(manageVendorsLabelKey(null, null)).toBeNull();
  });

  it("shows the administrator label to administrators", () => {
    expect(manageVendorsLabelKey({ role: "administrator" }, null)).toBe("vendors.manage.admin");
  });

  it("shows the personal label to an owner or an operator", () => {
    expect(manageVendorsLabelKey({ role: "regular" }, { owned, operating: [] })).toBe(
      "vendors.manage.mine",
    );
    expect(
      manageVendorsLabelKey(
        { role: "regular" },
        { owned: null, operating: [{ slug: "acme", name: "Acme" }] },
      ),
    ).toBe("vendors.manage.mine");
  });

  it("shows nothing to a user with nothing to manage", () => {
    expect(manageVendorsLabelKey({ role: "regular" }, { owned: null, operating: [] })).toBeNull();
    expect(manageVendorsLabelKey({ role: "regular" }, null)).toBeNull();
  });
});
