import { beforeEach, describe, expect, it, vi } from "vitest";

import { ORIGIN, TOKEN, failure, form, ok, outcome, token } from "../../testing/actions";
import { cartCookie, postForm, readCartCookie } from "../../testing/cart";

const api = vi.hoisted(() => ({ POST: vi.fn(), GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loginAction } = await import("./loginAction.server");

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const LINES = [{ productId: "0b4fd4a1-8e8f-4f4a-9a52-6f1c4a5d2c11", quantity: 2 }];

async function loginWith(userId: string, cart: string) {
  api.POST.mockResolvedValue(token());
  api.GET.mockResolvedValue(ok({ id: userId }));

  const response = (await loginAction(
    postForm(`${ORIGIN}/login`, { email: "jane@example.com", password: "pw" }, [cart]),
  )) as Response;

  return (response.headers.getSetCookie()[1] ?? "").split(";")[0] ?? "";
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("loginAction", () => {
  it("redirects with an HttpOnly cookie and keeps the token out of the body", async () => {
    api.POST.mockResolvedValue(token());
    api.GET.mockResolvedValue(ok({ id: USER }));

    const response = (await loginAction(
      form({ email: "jane@example.com", password: "pw" }),
    )) as Response;
    const cookie = response.headers.getSetCookie()[0] ?? "";

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

  it("binds the guest cart to the user who logs in", async () => {
    const bound = await loginWith(USER, await cartCookie({ lines: LINES }));

    const cart = await readCartCookie(bound);

    expect(cart.lines).toEqual(LINES);
    expect(cart.owner).toBe(USER);
  });

  it("drops a cart that belongs to another user", async () => {
    const owned = await loginWith(USER, await cartCookie({ lines: LINES }));
    const other = await loginWith(OTHER, owned);

    const cart = await readCartCookie(other);

    expect(cart.lines).toEqual([]);
    expect(cart.owner).toBe(OTHER);
  });

  it("redirects to a safe redirectTo and ignores an external one", async () => {
    api.POST.mockResolvedValue(token());
    api.GET.mockResolvedValue(ok({ id: USER }));
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
