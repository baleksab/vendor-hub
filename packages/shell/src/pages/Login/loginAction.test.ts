import { beforeEach, describe, expect, it, vi } from "vitest";

import { ORIGIN, TOKEN, failure, form, outcome, token } from "../../testing/actions";

const api = vi.hoisted(() => ({ POST: vi.fn(), GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loginAction } = await import("./loginAction.server");

beforeEach(() => {
  vi.resetAllMocks();
});

describe("loginAction", () => {
  it("redirects with an HttpOnly cookie and keeps the token out of the body", async () => {
    api.POST.mockResolvedValue(token());

    const response = (await loginAction(
      form({ email: "jane@example.com", password: "pw" }),
    )) as Response;
    const cookie = response.headers.get("Set-Cookie") ?? "";

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    expect(await response.text()).not.toContain(TOKEN);
    expect(cookie).toMatch(/^session=/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=3600");
  });

  it("redirects to a safe redirectTo and ignores an external one", async () => {
    api.POST.mockResolvedValue(token());
    const credentials = { email: "jane@example.com", password: "pw" };

    const safe = (await loginAction(
      form(credentials, `${ORIGIN}/login?redirectTo=%2Fvendors`),
    )) as Response;
    const evil = (await loginAction(
      form(credentials, `${ORIGIN}/login?redirectTo=%2F%2Fevil.com`),
    )) as Response;

    expect(safe.headers.get("Location")).toBe("/vendors");
    expect(evil.headers.get("Location")).toBe("/");
  });

  it("returns field errors as message keys and never echoes the password", async () => {
    const result = (await outcome(loginAction(form({ email: "nope", password: "" })))) as {
      data: { fields: Record<string, string>; values: Record<string, string> };
      init: ResponseInit;
    };

    expect(result.init.status).toBe(400);
    expect(result.data.fields).toEqual({
      email: "validation.email",
      password: "validation.required",
    });
    expect(result.data.values).toEqual({ email: "nope" });
    expect(api.POST).not.toHaveBeenCalled();
  });

  it("answers wrong credentials with one generic form error and no cookie", async () => {
    api.POST.mockResolvedValue(failure(401, "Unauthorized"));

    const result = (await outcome(
      loginAction(form({ email: "jane@example.com", password: "wrong" })),
    )) as { data: { form: string }; init: ResponseInit };

    expect(result.init.status).toBe(401);
    expect(result.data.form).toBe("auth.error.invalidCredentials");
  });

  it("reports an unreachable API as a network error", async () => {
    api.POST.mockRejectedValue(new TypeError("fetch failed"));

    const result = (await outcome(
      loginAction(form({ email: "jane@example.com", password: "pw" })),
    )) as { data: { form: string }; init: ResponseInit };

    expect(result.init.status).toBe(502);
    expect(result.data.form).toBe("auth.error.network");
  });

  it("rejects a foreign or missing Origin", async () => {
    const foreign = loginAction(
      form({ email: "a@b.io", password: "x" }, undefined, "http://evil.test"),
    );

    await expect(foreign).rejects.toMatchObject({ status: 403 });
    expect(api.POST).not.toHaveBeenCalled();
  });
});
