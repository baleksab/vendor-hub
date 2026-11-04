import { describe, expect, it } from "vitest";

import { resolveLocale } from "./server";

function requestWith(headers: Record<string, string>): Request {
  return new Request("http://localhost/", { headers });
}

describe("resolveLocale", () => {
  it("prefers the cookie over Accept-Language", () => {
    const request = requestWith({ Cookie: "locale=sr", "Accept-Language": "en" });

    expect(resolveLocale(request, "en")).toBe("sr");
  });

  it("ignores an invalid cookie and falls back to Accept-Language", () => {
    const request = requestWith({ Cookie: "locale=de", "Accept-Language": "sr-RS,en;q=0.5" });

    expect(resolveLocale(request, "en")).toBe("sr");
  });

  it("picks the supported language with the highest quality", () => {
    const request = requestWith({ "Accept-Language": "de,en;q=0.4,sr;q=0.8" });

    expect(resolveLocale(request, "en")).toBe("sr");
  });

  it("returns the default when nothing matches", () => {
    expect(resolveLocale(requestWith({}), "sr")).toBe("sr");
    expect(resolveLocale(requestWith({ "Accept-Language": "de,fr" }), "en")).toBe("en");
  });
});
