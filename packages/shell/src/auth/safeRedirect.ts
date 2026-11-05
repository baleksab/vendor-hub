const SPACE_CODE = 32;
const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";
const SINGLE_FETCH_SUFFIX = ".data";
const SINGLE_FETCH_ROUTES_PARAM = "_routes";
const SINGLE_FETCH_ROOT = "/_root";

export function safeRedirectTo(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) < SPACE_CODE) {
      return fallback;
    }
  }

  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);

    return url.origin === PLACEHOLDER_ORIGIN ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}

export function loginPath(redirectTo: string): string {
  return `/login?redirectTo=${encodeURIComponent(redirectTo)}`;
}

export function redirectTarget(request: Request): string {
  return safeRedirectTo(new URL(request.url).searchParams.get("redirectTo"));
}

export function requestTarget(request: Request): string {
  const url = new URL(request.url);
  let pathname = url.pathname;

  if (pathname.endsWith(SINGLE_FETCH_SUFFIX)) {
    pathname = pathname.slice(0, -SINGLE_FETCH_SUFFIX.length);
  }

  if (pathname === SINGLE_FETCH_ROOT) {
    pathname = "/";
  }

  url.searchParams.delete(SINGLE_FETCH_ROUTES_PARAM);

  return pathname + url.search;
}
