import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ORIGIN, TOKEN } from "../testing/actions";

const { loader, action } = await import("./apiProxy");
const { commitToken } = await import("../auth/sessionCookie.server");

const fetchMock = vi.fn();

type Args = Parameters<typeof loader>[0];

const call = (request: Request) =>
  (request.method === "GET" ? loader : action)({ request } as Args & Parameters<typeof action>[0]);

async function proxied(path: string, init: RequestInit = {}, withCookie = true) {
  const headers = new Headers(init.headers);

  if (withCookie) {
    headers.set("Cookie", (await commitToken(TOKEN, 60)).split(";")[0] ?? "");
  }

  return new Request(`${ORIGIN}${path}`, { ...init, headers });
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("api proxy", () => {
  it("answers 401 without a session cookie", async () => {
    const response = await call(await proxied("/api/v1/users", {}, false));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("adds the bearer token and passes status and body through", async () => {
    fetchMock.mockResolvedValueOnce(json({ data: [] }));

    const response = await call(await proxied("/api/v1/users?limit=5&offset=10"));
    const [target, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(String(target)).toBe("http://api.test/api/v1/users?limit=5&offset=10");
    expect(new Headers(init.headers).get("Authorization")).toBe(`Bearer ${TOKEN}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [] });
  });

  it("does not forward the cookie header", async () => {
    fetchMock.mockResolvedValueOnce(json({}));

    await call(await proxied("/api/v1/users/abc-123"));

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(new Headers(init.headers).has("Cookie")).toBe(false);
  });

  it("forwards a PATCH with its body from the same origin", async () => {
    fetchMock.mockResolvedValueOnce(json({ id: "abc-123" }));

    const request = await proxied("/api/v1/users/abc-123", {
      method: "PATCH",
      headers: { Origin: ORIGIN, "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "Ana" }),
    });
    const response = await call(request);
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(response.status).toBe(200);
    expect(init.method).toBe("PATCH");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("rejects a non-GET request from another origin", async () => {
    const request = await proxied("/api/v1/users/abc-123", {
      method: "PATCH",
      headers: { Origin: "http://evil.test", "Content-Type": "application/json" },
      body: "{}",
    });

    await expect(call(request)).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["/api/v1/vendors", "/api/v1/countries/x", "/api/v1/users/a/b", "/api/v1/users/..%2Fme"])(
    "answers 404 for %s",
    async (path) => {
      const response = await call(await proxied(path));

      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("forwards the country list", async () => {
    fetchMock.mockResolvedValueOnce(json({ data: ["RS"] }));

    expect((await call(await proxied("/api/v1/countries"))).status).toBe(200);
  });

  it("answers 404 for a method outside the allowlist", async () => {
    const request = await proxied("/api/v1/users", {
      method: "POST",
      headers: { Origin: ORIGIN },
      body: "{}",
    });

    expect((await call(request)).status).toBe(404);
  });

  it("passes an upstream error status through", async () => {
    fetchMock.mockResolvedValueOnce(json({ title: "Forbidden", status: 403, detail: "" }, 403));

    expect((await call(await proxied("/api/v1/users"))).status).toBe(403);
  });

  it("answers 502 when the API is down", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    expect((await call(await proxied("/api/v1/users"))).status).toBe(502);
  });
});
