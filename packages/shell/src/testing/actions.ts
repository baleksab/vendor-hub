Object.assign(process.env, {
  DEFAULT_LOCALE: "en",
  SHELL_HOST: "localhost",
  SHELL_PORT: "4100",
  SHELL_ORIGIN: "http://shell.test",
  USER_ADMINISTRATOR_MANIFEST_URL: "http://admin.test/mf-manifest.json",
  VENDOR_ADMINISTRATOR_MANIFEST_URL: "http://manage.test/mf-manifest.json",
  API_URL: "http://api.test",
  SESSION_COOKIE_NAME: "session",
  SESSION_COOKIE_SECURE: "true",
});

export const ORIGIN = "http://shell.test";
export const TOKEN = "header.payload.signature";

export const ok = (data: unknown, status = 200) => ({
  data,
  response: new Response(null, { status }),
});

export const failure = (status: number, statusText: string, errors?: object[]) => ({
  error: { title: statusText, status, detail: "Backend detail", errors },
  response: new Response(null, { status, statusText }),
});

export const token = (expiresIn = 3600) =>
  ok({ accessToken: TOKEN, tokenType: "Bearer", expiresIn });

export function form(values: Record<string, string>, url = `${ORIGIN}/login`, origin = ORIGIN) {
  return new Request(url, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(values),
  });
}

export async function outcome(
  promise: Promise<unknown>,
): Promise<Response | { data: unknown; init: ResponseInit }> {
  return (await promise) as Response | { data: unknown; init: ResponseInit };
}

export async function authedForm(
  values: Record<string, string>,
  url: string,
  origin = ORIGIN,
): Promise<Request> {
  const { commitToken } = await import("../auth/sessionCookie.server");
  const cookie = (await commitToken(TOKEN, 60)).split(";")[0] ?? "";

  return new Request(url, {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(values),
  });
}
