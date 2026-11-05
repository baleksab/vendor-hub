import { beforeEach, describe, expect, it, vi } from "vitest";

import { ORIGIN, failure, form, ok, outcome, token } from "../../testing/actions";

const api = vi.hoisted(() => ({ POST: vi.fn(), GET: vi.fn() }));

vi.mock("../../api/createServerApi.server", () => ({ createServerApi: () => api }));

const { registerAction } = await import("./registerAction.server");

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
