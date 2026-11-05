import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../api/ApiError";

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

const api = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));

vi.mock("../api/createServerApi.server", () => ({
  API_PREFIX: "/api/v1",
  createServerApi: () => api,
}));

const { action: loginAction } = await import("./auth.login");
const { action: logoutAction } = await import("./auth.logout");
const proxy = await import("./api.proxy");

const ORIGIN = "http://shell.test";
const TOKEN = "header.payload.signature";
const user = { id: "1", email: "jane@example.com", firstName: "Jane", lastName: "Doe" };

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
}

async function statusOf(promise: Promise<Response> | Response): Promise<number> {
  try {
    return (await promise).status;
  } catch (thrown) {
    return (thrown as Response).status;
  }
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("POST /auth/login", () => {
  it("sets an HttpOnly cookie and never returns the token in the body", async () => {
    api.post.mockResolvedValue({
      data: { accessToken: TOKEN, tokenType: "Bearer", expiresIn: 3600 },
    });
    api.get.mockResolvedValue({ data: user });

    const response = await loginAction({
      request: post("/auth/login", { email: "jane@example.com", password: "pw" }),
    } as never);
    const cookie = response.headers.get("Set-Cookie") ?? "";
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(JSON.parse(body)).toEqual(user);
    expect(body).not.toContain(TOKEN);
    expect(cookie).toMatch(/^session=/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=3600");
  });

  it("forwards a 401 problem without a cookie", async () => {
    api.post.mockRejectedValue(
      new ApiError({ status: 401, kind: "unauthorized", title: "Unauthorized", detail: "Bad" }),
    );

    const response = await loginAction({
      request: post("/auth/login", { email: "jane@example.com", password: "pw" }),
    } as never);

    expect(response.status).toBe(401);
    expect(response.headers.get("Content-Type")).toContain("application/problem+json");
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("returns 400 for an invalid body and 502 when the API is unreachable", async () => {
    const invalid = await loginAction({ request: post("/auth/login", { email: "x" }) } as never);

    expect(invalid.status).toBe(400);

    api.post.mockRejectedValue(
      new ApiError({ status: 0, kind: "network", title: "Network error", detail: "down" }),
    );
    const down = await loginAction({
      request: post("/auth/login", { email: "jane@example.com", password: "pw" }),
    } as never);

    expect(down.status).toBe(502);
  });

  it("rejects a foreign origin and a non-JSON content type", async () => {
    const foreign = post("/auth/login", {}, { Origin: "http://evil.test" });
    const form = post("/auth/login", {}, { "Content-Type": "text/plain" });

    expect(await statusOf(loginAction({ request: foreign } as never))).toBe(403);
    expect(await statusOf(loginAction({ request: form } as never))).toBe(403);
  });
});

describe("POST /auth/logout", () => {
  it("clears the cookie", async () => {
    const response = await logoutAction({ request: post("/auth/logout", {}) } as never);

    expect(response.status).toBe(204);
    expect(response.headers.get("Set-Cookie")).toMatch(/^session=;.*Max-Age=0/);
  });

  it("rejects a foreign origin", async () => {
    const request = post("/auth/logout", {}, { Origin: "http://evil.test" });

    expect(await statusOf(logoutAction({ request } as never))).toBe(403);
  });
});

describe("/api/* proxy", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  async function cookieHeader(): Promise<string> {
    const response = await loginSetup();

    return response.split(";")[0] ?? "";
  }

  async function loginSetup(): Promise<string> {
    api.post.mockResolvedValue({
      data: { accessToken: TOKEN, tokenType: "Bearer", expiresIn: 60 },
    });
    api.get.mockResolvedValue({ data: user });
    const response = await loginAction({
      request: post("/auth/login", { email: "a@b.io", password: "x" }),
    } as never);

    return response.headers.get("Set-Cookie") ?? "";
  }

  it("adds the bearer token from the cookie and returns the upstream response", async () => {
    const cookie = await cookieHeader();

    fetchMock.mockResolvedValue(
      new Response('{"data":[]}', { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const request = new Request(`${ORIGIN}/api/users?limit=5`, { headers: { Cookie: cookie } });
    const response = await proxy.loader({ request, params: { "*": "users" } } as never);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(url.href).toBe("http://api.test/api/v1/users?limit=5");
    expect(new Headers(init.headers).get("Authorization")).toBe(`Bearer ${TOKEN}`);
    expect(await response.text()).toBe('{"data":[]}');
  });

  it("clears the cookie when the API answers 401", async () => {
    const cookie = await cookieHeader();

    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    const request = new Request(`${ORIGIN}/api/users/me`, { headers: { Cookie: cookie } });
    const response = await proxy.loader({ request, params: { "*": "users/me" } } as never);

    expect(response.status).toBe(401);
    expect(response.headers.get("Set-Cookie")).toMatch(/Max-Age=0/);
  });

  it("forwards without Authorization when there is no cookie", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));

    const response = await proxy.action({
      request: post("/api/users", { a: 1 }),
      params: { "*": "users" },
    } as never);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;

    expect(response.status).toBe(201);
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
    expect(init.body).toBe('{"a":1}');
  });

  it("never exposes the token endpoint or escapes the API prefix", async () => {
    for (const splat of [
      "auth",
      "auth/x",
      "../health",
      "users/../../health",
      "%2e%2e/health",
      "",
    ]) {
      const request = post("/api/x", {});
      const response = await proxy.action({ request, params: { "*": splat } } as never);

      expect(response.status).toBe(404);
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects cross-origin writes", async () => {
    const request = post("/api/users", {}, { Origin: "http://evil.test" });

    expect(await statusOf(proxy.action({ request, params: { "*": "users" } } as never))).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 502 when the API is down", async () => {
    fetchMock.mockRejectedValue(new Error("down"));

    const request = new Request(`${ORIGIN}/api/users`);
    const response = await proxy.loader({ request, params: { "*": "users" } } as never);

    expect(response.status).toBe(502);
  });
});
