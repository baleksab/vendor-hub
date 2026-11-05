import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  Object.assign(process.env, {
    DEFAULT_LOCALE: "en",
    SHELL_HOST: "localhost",
    SHELL_PORT: "4100",
    SHELL_ORIGIN: "http://shell.test",
    REMOTE_TEST_MANIFEST_URL: "http://remote.test/mf-manifest.json",
    API_URL: "http://api.test",
    SESSION_COOKIE_NAME: "session",
    SESSION_COOKIE_SECURE: "true",
  });
});

const api = vi.hoisted(() => ({ POST: vi.fn(), GET: vi.fn() }));

vi.mock("../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { loginAction, logoutAction, registerAction } = await import("./authActions.server");

const ORIGIN = "http://shell.test";
const TOKEN = "header.payload.signature";

const ok = (data: unknown, status = 200) => ({ data, response: new Response(null, { status }) });
const failure = (status: number, statusText: string, errors?: object[]) => ({
  error: { title: statusText, status, detail: "Backend detail", errors },
  response: new Response(null, { status, statusText }),
});
const token = (expiresIn = 3600) => ok({ accessToken: TOKEN, tokenType: "Bearer", expiresIn });

function form(values: Record<string, string>, url = `${ORIGIN}/login`, origin = ORIGIN) {
  return new Request(url, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(values),
  });
}

async function outcome(
  promise: Promise<unknown>,
): Promise<Response | { data: unknown; init: ResponseInit }> {
  return (await promise) as Response | { data: unknown; init: ResponseInit };
}

const registration = {
  email: " Jane@Example.com ",
  password: "correct-horse",
  confirmPassword: "correct-horse",
  firstName: "Jane",
  lastName: "Doe",
  address: "Main street 1",
  phoneNumber: "+381601234567",
  country: "RS",
};

beforeEach(() => {
  vi.resetAllMocks();
  api.GET.mockResolvedValue(ok({ data: ["RS", "DE"] }));
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
      form(credentials, `${ORIGIN}/login?redirectTo=%2Fremote-test`),
    )) as Response;
    const evil = (await loginAction(
      form(credentials, `${ORIGIN}/login?redirectTo=%2F%2Fevil.com`),
    )) as Response;

    expect(safe.headers.get("Location")).toBe("/remote-test");
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

describe("registerAction", () => {
  const request = (values = registration, url = `${ORIGIN}/register`) => form(values, url);

  it("creates the user, logs in and redirects with a cookie", async () => {
    api.POST.mockResolvedValueOnce(ok({ id: "1" }, 201)).mockResolvedValueOnce(token(60));

    const response = (await registerAction(request())) as Response;
    const [, createCall] = api.POST.mock.calls[0] as [string, { body: Record<string, unknown> }];

    expect(response.status).toBe(302);
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=60");
    expect(createCall.body.email).toBe("jane@example.com");
    expect(createCall.body).not.toHaveProperty("confirmPassword");
  });

  it("rejects an unsupported country and a password mismatch before calling the API", async () => {
    const result = (await outcome(
      registerAction(request({ ...registration, country: "XX", confirmPassword: "other" })),
    )) as { data: { fields: Record<string, string> }; init: ResponseInit };

    expect(result.init.status).toBe(400);
    expect(result.data.fields.country).toBe("validation.country");
    expect(result.data.fields.confirmPassword).toBe("validation.passwordMismatch");
    expect(api.POST).not.toHaveBeenCalled();
  });

  it("puts a duplicate email on the email field", async () => {
    api.POST.mockResolvedValueOnce(failure(409, "Conflict"));

    const result = (await outcome(registerAction(request()))) as {
      data: { fields: Record<string, string>; values: Record<string, string> };
    };

    expect(result.data.fields).toEqual({ email: "auth.error.emailTaken" });
    expect(result.data.values).not.toHaveProperty("password");
  });

  it("passes server field errors through", async () => {
    api.POST.mockResolvedValueOnce(
      failure(400, "Bad Request", [{ path: "phoneNumber", message: "Server says no" }]),
    );

    const result = (await outcome(registerAction(request()))) as {
      data: { fields: Record<string, string> };
    };

    expect(result.data.fields).toEqual({ phoneNumber: "Server says no" });
  });

  it("sends the user to /login when the automatic login fails", async () => {
    api.POST.mockResolvedValueOnce(ok({ id: "1" }, 201)).mockResolvedValueOnce(
      failure(500, "Server Error"),
    );

    const response = (await registerAction(request())) as Response;

    expect(response.headers.get("Location")).toBe("/login?registered=1");
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("shows a form error when the country list cannot be loaded", async () => {
    api.GET.mockRejectedValue(new TypeError("fetch failed"));

    const result = (await outcome(registerAction(request()))) as { data: { form: string } };

    expect(result.data.form).toBe("auth.error.network");
  });
});

describe("logoutAction", () => {
  it("clears the cookie and redirects home", async () => {
    const response = await logoutAction(form({}, `${ORIGIN}/logout`));

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    expect(response.headers.get("Set-Cookie")).toMatch(/^session=;.*Max-Age=0/);
  });

  it("rejects a foreign origin", async () => {
    await expect(
      logoutAction(form({}, `${ORIGIN}/logout`, "http://evil.test")),
    ).rejects.toMatchObject({ status: 403 });
  });
});
