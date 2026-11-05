const SPACE_CODE = 32;
const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";

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
