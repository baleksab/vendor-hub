import { describe, expect, it } from "vitest";

import { ApiError } from "@vendor-hub/api-client";
import { describeError } from "./describeError";

describe("describeError", () => {
  const make = (kind: ApiError["kind"], fieldErrors = {}) =>
    new ApiError({ status: 1, kind, title: "t", detail: "backend detail", fieldErrors });

  it("never says which login credential was wrong", () => {
    expect(describeError(make("unauthorized"), "login")).toEqual({
      form: "auth.error.invalidCredentials",
      fields: {},
    });
  });

  it("maps a 401 outside login to session expired", () => {
    expect(describeError(make("unauthorized"), "generic").form).toBe("auth.error.sessionExpired");
  });

  it("puts a register conflict on the email field", () => {
    expect(describeError(make("conflict"), "register")).toEqual({
      form: null,
      fields: { email: "auth.error.emailTaken" },
    });
  });

  it("passes server field errors through", () => {
    expect(describeError(make("validation", { phoneNumber: "bad" }), "register").fields).toEqual({
      phoneNumber: "bad",
    });
  });

  it("separates network and server failures", () => {
    expect(describeError(make("network"), "login").form).toBe("auth.error.network");
    expect(describeError(make("server"), "login").form).toBe("auth.error.server");
  });

  it("falls back to the backend detail for unknown 4xx", () => {
    expect(describeError(make("client"), "login").form).toBe("backend detail");
  });

  it("handles non-ApiError values", () => {
    expect(describeError(new Error("x"), "login").form).toBe("auth.error.generic");
  });
});

describe("describeError for vendors", () => {
  const make = (kind: ApiError["kind"], status = 1) =>
    new ApiError({ status, kind, title: "t", detail: "backend detail" });

  it("puts a slug conflict on the slug field", () => {
    expect(describeError(make("conflict"), "vendor").fields).toEqual({
      slug: "vendor.error.slugTaken",
    });
  });
});
