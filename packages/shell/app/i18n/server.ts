import { isLocale, type Locale } from "./locales";

const COOKIE_NAME = "locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function serializeLocaleCookie(locale: Locale): string {
  return `${COOKIE_NAME}=${locale}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function fromCookie(header: string | null): Locale | null {
  for (const part of header?.split(";") ?? []) {
    const [name, value] = part.trim().split("=");

    if (name === COOKIE_NAME && isLocale(value)) {
      return value;
    }
  }

  return null;
}

function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) {
    return null;
  }

  const candidates = header.split(",").map((part) => {
    const [tag = "", ...attrs] = part.trim().split(";");
    const q = attrs.map((attr) => attr.trim()).find((attr) => attr.startsWith("q="));

    return {
      language: tag.trim().toLowerCase().split("-")[0],
      quality: q ? Number(q.slice(2)) : 1,
    };
  });

  const sorted = candidates
    .filter((candidate) => !Number.isNaN(candidate.quality))
    .sort((a, b) => b.quality - a.quality);

  for (const candidate of sorted) {
    if (isLocale(candidate.language)) {
      return candidate.language;
    }
  }

  return null;
}

export function resolveLocale(request: Request, defaultLocale: Locale): Locale {
  return (
    fromCookie(request.headers.get("Cookie")) ??
    fromAcceptLanguage(request.headers.get("Accept-Language")) ??
    defaultLocale
  );
}
