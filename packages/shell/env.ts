import { isLocale, LOCALES, type Locale } from "./src/i18n/locales.ts";

export type ShellEnv = {
  defaultLocale: Locale;
  host: string;
  port: number;
  origin: string;
  userAdministratorManifestUrl: string;
  vendorAdministratorManifestUrl: string;
  apiUrl: string;
  sessionCookieName: string;
  sessionCookieSecure: boolean;
  cartCookieName: string;
  cartMaxLines: number;
  cartMaxQuantityPerLine: number;
};

export type ShellSecrets = {
  sessionSecret: string;
};

type Source = Record<string, string | undefined>;

const SESSION_SECRET_MIN_BYTES = 32;

function required(source: Source, key: string): string {
  const value = source[key];

  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing required env key ${key} (set it in .env.local, .env.secret or the process environment)`,
    );
  }

  return value.trim();
}

function parsePort(source: Source, key: string): number {
  const raw = required(source, key);
  const port = Number(raw);

  if (!Number.isInteger(port) || port < 1 || port > 0xffff) {
    throw new Error(`Env key ${key} must be a port number, got "${raw}"`);
  }

  return port;
}

function parseUrl(source: Source, key: string): string {
  const raw = required(source, key);

  try {
    return new URL(raw).toString();
  } catch {
    throw new Error(`Env key ${key} must be a valid URL, got "${raw}"`);
  }
}

function parsePositiveInteger(source: Source, key: string): number {
  const raw = required(source, key);
  const value = Number(raw);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Env key ${key} must be a positive integer, got "${raw}"`);
  }

  return value;
}

function parseSecret(source: Source, key: string): string {
  const secret = required(source, key);

  if (new TextEncoder().encode(secret).byteLength < SESSION_SECRET_MIN_BYTES) {
    throw new Error(`Env key ${key} must be at least ${SESSION_SECRET_MIN_BYTES} bytes long`);
  }

  return secret;
}

function parseBoolean(source: Source, key: string): boolean {
  const raw = required(source, key);

  if (raw !== "true" && raw !== "false") {
    throw new Error(`Env key ${key} must be "true" or "false", got "${raw}"`);
  }

  return raw === "true";
}

function parseLocale(source: Source, key: string): Locale {
  const raw = required(source, key);

  if (!isLocale(raw)) {
    throw new Error(`Env key ${key} must be one of ${LOCALES.join(", ")}, got "${raw}"`);
  }

  return raw;
}

export function readShellEnv(source: Source): ShellEnv {
  return {
    defaultLocale: parseLocale(source, "DEFAULT_LOCALE"),
    host: required(source, "SHELL_HOST"),
    port: parsePort(source, "SHELL_PORT"),
    origin: new URL(parseUrl(source, "SHELL_ORIGIN")).origin,
    userAdministratorManifestUrl: parseUrl(source, "USER_ADMINISTRATOR_MANIFEST_URL"),
    vendorAdministratorManifestUrl: parseUrl(source, "VENDOR_ADMINISTRATOR_MANIFEST_URL"),
    apiUrl: new URL(parseUrl(source, "API_URL")).origin,
    sessionCookieName: required(source, "SESSION_COOKIE_NAME"),
    sessionCookieSecure: parseBoolean(source, "SESSION_COOKIE_SECURE"),
    cartCookieName: required(source, "CART_COOKIE_NAME"),
    cartMaxLines: parsePositiveInteger(source, "CART_MAX_LINES"),
    cartMaxQuantityPerLine: parsePositiveInteger(source, "CART_MAX_QUANTITY_PER_LINE"),
  };
}

export function readShellSecrets(source: Source): ShellSecrets {
  return { sessionSecret: parseSecret(source, "SHELL_SESSION_SECRET") };
}
