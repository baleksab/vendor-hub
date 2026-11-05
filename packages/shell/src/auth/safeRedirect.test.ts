import { describe, expect, it } from "vitest";

import { loginPath, requestTarget, safeRedirectTo } from "./safeRedirect";

describe("safeRedirectTo", () => {
  it("keeps same-origin relative paths with query and hash", () => {
    expect(safeRedirectTo("/vendors?a=1#top")).toBe("/vendors?a=1#top");
  });

  it.each([
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil",
    "/ok\nHeader: x",
    "",
    null,
    undefined,
  ])("falls back for %s", (value) => {
    expect(safeRedirectTo(value)).toBe("/");
  });

  it("uses the given fallback", () => {
    expect(safeRedirectTo("//evil.com", "/home")).toBe("/home");
  });
});

describe("loginPath", () => {
  it("encodes the target", () => {
    expect(loginPath("/a?b=1")).toBe("/login?redirectTo=%2Fa%3Fb%3D1");
  });
});

describe("requestTarget", () => {
  const target = (path: string) => requestTarget(new Request(`http://localhost${path}`));

  it("keeps a normal path with its query", () => {
    expect(target("/become-vendor?a=1")).toBe("/become-vendor?a=1");
  });

  it("strips the single fetch suffix", () => {
    expect(target("/become-vendor.data")).toBe("/become-vendor");
    expect(target("/vendors/acme.data?page=2")).toBe("/vendors/acme?page=2");
  });

  it("maps the root data request to /", () => {
    expect(target("/_root.data")).toBe("/");
  });

  it("drops the _routes param added by single fetch", () => {
    expect(target("/vendors.data?page=2&_routes=routes%2Fa")).toBe("/vendors?page=2");
  });
});
