import { API_PREFIX } from "../api/createServerApi.server";
import { getEnv } from "../env.server";
import { assertSameOrigin } from "../auth/sameOrigin.server";
import { clearToken, readToken } from "../auth/sessionCookie.server";
import type { Route } from "./+types/api.proxy";

const FORWARDED_REQUEST_HEADERS = ["Content-Type", "Accept", "Accept-Language"];
const FORWARDED_RESPONSE_HEADERS = ["Content-Type", "Location", "Retry-After"];
const BODYLESS_STATUSES = new Set([204, 205, 304]);
const BODYLESS_METHODS = new Set(["GET", "HEAD"]);
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const BAD_GATEWAY = 502;
const BLOCKED_PATHS = new Set(["auth"]);

function isForwardable(splat: string): boolean {
  const segments = splat.split("/");

  return (
    !segments.some(
      (segment) =>
        segment === "" || segment === "." || segment === ".." || /%2e|%2f|%5c|\\/i.test(segment),
    ) && !BLOCKED_PATHS.has(segments[0] ?? "")
  );
}

async function proxy(request: Request, splat: string | undefined): Promise<Response> {
  assertSameOrigin(request);

  if (splat === undefined || !isForwardable(splat)) {
    return new Response("Not found", { status: NOT_FOUND });
  }

  const token = await readToken(request);
  const headers = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);

    if (value !== null) {
      headers.set(name, value);
    }
  }

  if (token !== null) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const target = new URL(`${API_PREFIX}/${splat}${new URL(request.url).search}`, getEnv().apiUrl);
  let upstream: Response;

  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: BODYLESS_METHODS.has(request.method) ? undefined : await request.text(),
      redirect: "manual",
    });
  } catch {
    return new Response("Bad gateway", { status: BAD_GATEWAY });
  }

  const responseHeaders = new Headers();

  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);

    if (value !== null) {
      responseHeaders.set(name, value);
    }
  }

  if (upstream.status === UNAUTHORIZED && token !== null) {
    responseHeaders.append("Set-Cookie", await clearToken());
  }

  return new Response(BODYLESS_STATUSES.has(upstream.status) ? null : await upstream.text(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export function loader({ request, params }: Route.LoaderArgs) {
  return proxy(request, params["*"]);
}

export function action({ request, params }: Route.ActionArgs) {
  return proxy(request, params["*"]);
}
