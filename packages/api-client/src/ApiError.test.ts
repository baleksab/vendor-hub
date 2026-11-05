import { describe, expect, it } from "vitest";

import { ApiError, fromResponse, networkError } from "./ApiError";

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
