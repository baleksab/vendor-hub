import { redirect } from "react-router";

import { ApiError } from "../api/ApiError";
import { createServerApi } from "../api/createServerApi.server";
import type { UserResponse } from "../api/types";
import { safeRedirectTo, loginPath } from "./safeRedirect";
import { clearToken, readToken } from "./sessionCookie.server";

export type Session = { user: UserResponse; token: string };

export type SessionResult = { session: Session | null; headers: Headers };

const cache = new WeakMap<Request, Promise<SessionResult>>();

async function loadSession(request: Request): Promise<SessionResult> {
  const headers = new Headers();
  const token = await readToken(request);

  if (token === null) {
    return { session: null, headers };
  }

  try {
    const { data } = await createServerApi(token).get<UserResponse>("/users/me");

    return { session: { user: data, token }, headers };
  } catch (error) {
    if (error instanceof ApiError && error.kind === "unauthorized") {
      headers.append("Set-Cookie", await clearToken());
    }

    return { session: null, headers };
  }
}

export function getSession(request: Request): Promise<SessionResult> {
  let result = cache.get(request);

  if (result === undefined) {
    result = loadSession(request);
    cache.set(request, result);
  }

  return result;
}

export async function requireUser(request: Request): Promise<Session> {
  const { session, headers } = await getSession(request);

  if (session === null) {
    const url = new URL(request.url);

    throw redirect(loginPath(url.pathname + url.search), { headers });
  }

  return session;
}

export async function redirectIfAuthenticated(request: Request): Promise<void> {
  const { session } = await getSession(request);

  if (session !== null) {
    const redirectTo = new URL(request.url).searchParams.get("redirectTo");

    throw redirect(safeRedirectTo(redirectTo));
  }
}
