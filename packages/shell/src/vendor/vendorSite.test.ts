import { describe, expect, it } from "vitest";

import { readShellEnv } from "../../env";
import { readVendorSlug, vendorSiteOrigin } from "./vendorSite";

const template = "http://{slug}.vendorhub.localhost:8080";

describe("vendorSiteOrigin", () => {
  it("puts the slug into the template", () => {
    expect(vendorSiteOrigin(template, "acme")).toBe("http://acme.vendorhub.localhost:8080");
  });

  it("drops a path from the template", () => {
    expect(vendorSiteOrigin("https://{slug}.example.com/x", "acme")).toBe(
      "https://acme.example.com",
    );
  });
});

describe("readVendorSlug", () => {
  const request = (headers: Record<string, string>) =>
    new Request("http://shell.test/", { headers });

  it("reads and normalizes the header", () => {
    expect(readVendorSlug(request({ "X-Vendor-Slug": " Acme " }), "X-Vendor-Slug")).toBe("acme");
  });

  it("returns null for a missing or empty header", () => {
    expect(readVendorSlug(request({}), "X-Vendor-Slug")).toBeNull();
    expect(readVendorSlug(request({ "X-Vendor-Slug": "  " }), "X-Vendor-Slug")).toBeNull();
  });

  it("ignores a different header name", () => {
    expect(readVendorSlug(request({ "X-Other": "acme" }), "X-Vendor-Slug")).toBeNull();
  });
});

describe("VENDOR_SITE_ORIGIN parsing", () => {
  const base = {
    DEFAULT_LOCALE: "en",
    SHELL_HOST: "localhost",
    SHELL_PORT: "4100",
    SHELL_ORIGIN: "http://localhost:4100",
    REMOTE_TEST_MANIFEST_URL: "http://localhost:4101/mf-manifest.json",
    API_URL: "http://localhost:4200",
    SESSION_COOKIE_NAME: "session",
    SESSION_COOKIE_SECURE: "false",
    VENDOR_SLUG_HEADER: "X-Vendor-Slug",
  };

  it("accepts a template with one placeholder", () => {
    expect(readShellEnv({ ...base, VENDOR_SITE_ORIGIN: template }).vendorSiteOrigin).toBe(template);
  });

  it.each(["http://vendors.localhost:8080", "http://{slug}.{slug}.localhost", "not a url {slug}"])(
    "rejects %s",
    (value) => {
      expect(() => readShellEnv({ ...base, VENDOR_SITE_ORIGIN: value })).toThrow(
        /VENDOR_SITE_ORIGIN/,
      );
    },
  );

  it("requires the slug header name", () => {
    expect(() =>
      readShellEnv({ ...base, VENDOR_SITE_ORIGIN: template, VENDOR_SLUG_HEADER: "" }),
    ).toThrow(/VENDOR_SLUG_HEADER/);
  });
});
