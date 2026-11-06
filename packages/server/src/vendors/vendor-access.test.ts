import { describe, expect, it } from "vitest";

import { accessFor, resolveAccess, type Actor } from "./vendor-access.ts";

const owner: Actor = { userId: "owner", role: "regular" };
const operator: Actor = { userId: "operator", role: "regular" };
const outsider: Actor = { userId: "outsider", role: "regular" };
const administrator: Actor = { userId: "admin", role: "administrator" };

const vendor = {
  members: [
    { userId: "owner", firstName: "O", lastName: "W", role: "owner" as const },
    { userId: "operator", firstName: "O", lastName: "P", role: "operator" as const },
  ],
};

describe("resolveAccess", () => {
  it("gives the owner full access", () => {
    expect(resolveAccess(owner, vendor)).toEqual({
      viewerRole: "owner",
      memberRole: "owner",
      canDelete: true,
    });
  });

  it("lets the operator manage but not delete", () => {
    expect(resolveAccess(operator, vendor)).toEqual({
      viewerRole: "operator",
      memberRole: "operator",
      canDelete: false,
    });
  });

  it("gives an outsider no access", () => {
    expect(resolveAccess(outsider, vendor)).toBeUndefined();
  });

  it("gives the administrator full access without a membership", () => {
    expect(resolveAccess(administrator, vendor)).toEqual({
      viewerRole: "administrator",
      memberRole: null,
      canDelete: true,
    });
  });

  it("reports the administrator role even when the administrator is also a member", () => {
    const memberAdmin: Actor = { userId: "operator", role: "administrator" };

    expect(resolveAccess(memberAdmin, vendor)).toEqual({
      viewerRole: "administrator",
      memberRole: "operator",
      canDelete: true,
    });
  });
});

describe("accessFor", () => {
  it("resolves from a bare member role", () => {
    expect(accessFor(operator, "operator")?.canDelete).toBe(false);
    expect(accessFor(outsider, undefined)).toBeUndefined();
  });
});
