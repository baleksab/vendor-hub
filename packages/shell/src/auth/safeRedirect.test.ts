import { describe, expect, it } from "vitest";

import { loginPath, safeRedirectTo } from "./safeRedirect";

describe("safeRedirectTo", () => {
  it("keeps same-origin relative paths with query and hash", () => {
    expect(safeRedirectTo("/remote-test?a=1#top")).toBe("/remote-test?a=1#top");
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
