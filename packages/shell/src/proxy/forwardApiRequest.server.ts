import { REQUEST_TIMEOUT_MS } from "@vendor-hub/api-client";

import { assertSameOrigin } from "../auth/sameOrigin.server";
import { readToken } from "../auth/sessionCookie.server";
import { getEnv } from "../env.server";
import { matchProxied } from "./proxyAllowlist";

const PROBLEM_CONTENT_TYPE = "application/problem+json";

function problem(status: number, title: string): Response {
  return new Response(JSON.stringify({ title, status, detail: "" }), {
    status,
    headers: { "Content-Type": PROBLEM_CONTENT_TYPE, "Cache-Control": "no-store" },
  });
}

function upstreamHeaders(request: Request, token: string | null): Headers {
  const headers = new Headers({ Accept: request.headers.get("Accept") ?? "application/json" });

  if (token !== null) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const contentType = request.headers.get("Content-Type");

  if (contentType !== null) {
    headers.set("Content-Type", contentType);
  }

  return headers;
}

function passThrough(upstream: Response, keepCacheControl: boolean): Response {
  const cacheControl = keepCacheControl ? upstream.headers.get("Cache-Control") : null;
  const headers = new Headers({ "Cache-Control": cacheControl ?? "no-store" });
  const contentType = upstream.headers.get("Content-Type");

  if (contentType !== null) {
    headers.set("Content-Type", contentType);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}

export async function forwardApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  const route = matchProxied(request.method, url.pathname);

  if (route === undefined) {
    return problem(404, "Not Found");
  }

  assertSameOrigin(request);

  const token = await readToken(request);

  if (token === null && route.access === "authenticated") {
    return problem(401, "Unauthorized");
  }

  const hasBody = request.method !== "GET";

  try {
    const upstream = await fetch(new URL(url.pathname + url.search, getEnv().apiUrl), {
      method: request.method,
      headers: upstreamHeaders(request, token),
      body: hasBody ? request.body : undefined,
      duplex: "half",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    } as RequestInit);

    return passThrough(upstream, route.keepCacheControl === true);
  } catch {
    return problem(502, "Bad Gateway");
  }
}
