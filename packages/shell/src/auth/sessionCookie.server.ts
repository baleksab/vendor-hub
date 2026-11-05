import { createCookie } from "react-router";

import { getEnv } from "../env.server";

function sessionCookie() {
  const { sessionCookieName, sessionCookieSecure } = getEnv();

  return createCookie(sessionCookieName, {
    httpOnly: true,
    secure: sessionCookieSecure,
    sameSite: "lax",
    path: "/",
  });
}

export async function readToken(request: Request): Promise<string | null> {
  const value: unknown = await sessionCookie().parse(request.headers.get("Cookie"));

  return typeof value === "string" && value !== "" ? value : null;
}

export function commitToken(token: string, maxAgeSeconds: number): Promise<string> {
  return sessionCookie().serialize(token, { maxAge: maxAgeSeconds });
}

export function clearToken(): Promise<string> {
  return sessionCookie().serialize("", { maxAge: 0 });
}
