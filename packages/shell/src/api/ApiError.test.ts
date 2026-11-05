import { describe, expect, it } from "vitest";

import { ApiError, fromResponse, networkError } from "./ApiError";
import { describeError } from "./describeError";

const problem = (status: number, extra: object = {}) => ({
  title: "Title",
  status,
  detail: "Detail",
  ...extra,
});

describe("fromResponse", () => {
  it("maps a 400 problem to field errors keyed by path", () => {
    const error = fromResponse(
      400,
      "Bad Request",
      problem(400, {
        errors: [
          { path: "email", message: "Invalid email" },
          { path: "email", message: "second" },
          { path: "address.line", message: "Required" },
        ],
      }),
    );

    expect(error.kind).toBe("validation");
    expect(error.fieldErrors).toEqual({ email: "Invalid email", "address.line": "Required" });
  });

  it.each([
    [401, "unauthorized"],
    [409, "conflict"],
    [404, "client"],
    [503, "server"],
  ])("maps status %i to %s", (status, kind) => {
    expect(fromResponse(status, "Status", problem(status)).kind).toBe(kind);
  });

  it("falls back to the status when the body is not a problem", () => {
    const error = fromResponse(500, "Internal Server Error", "<html>boom</html>");

    expect(error.kind).toBe("server");
    expect(error.status).toBe(500);
    expect(error.detail).toBe("");
  });

  it("falls back to the status when there is no body", () => {
    expect(fromResponse(502, "Bad Gateway", undefined).kind).toBe("server");
  });
});

describe("networkError", () => {
  it("has status 0 and kind network", () => {
    const error = networkError(new TypeError("fetch failed"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe("network");
    expect(error.status).toBe(0);
    expect(error.detail).toBe("fetch failed");
  });
});

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
