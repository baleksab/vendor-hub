import { REQUEST_TIMEOUT_MS } from "@vendor-hub/api-client";

import { assertSameOrigin } from "../auth/sameOrigin.server";
import { readToken } from "../auth/sessionCookie.server";
import { getEnv } from "../env.server";
import { isProxied } from "./proxyAllowlist";

const PROBLEM_CONTENT_TYPE = "application/problem+json";

function problem(status: number, title: string): Response {
  return new Response(JSON.stringify({ title, status, detail: "" }), {
    status,
    headers: { "Content-Type": PROBLEM_CONTENT_TYPE, "Cache-Control": "no-store" },
  });
}

function upstreamHeaders(request: Request, token: string): Headers {
  const headers = new Headers({ Authorization: `Bearer ${token}`, Accept: "application/json" });
  const contentType = request.headers.get("Content-Type");

  if (contentType !== null) {
    headers.set("Content-Type", contentType);
  }

  return headers;
}

function passThrough(upstream: Response): Response {
  const headers = new Headers({ "Cache-Control": "no-store" });
  const contentType = upstream.headers.get("Content-Type");

  if (contentType !== null) {
    headers.set("Content-Type", contentType);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}

export async function forwardApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (!isProxied(request.method, url.pathname)) {
    return problem(404, "Not Found");
  }

  assertSameOrigin(request);

  const token = await readToken(request);

  if (token === null) {
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

    return passThrough(upstream);
  } catch {
    return problem(502, "Bad Gateway");
  }
}
