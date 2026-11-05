import { isLocale, LOCALES, type Locale } from "./src/i18n/locales.ts";

export type ShellEnv = {
  defaultLocale: Locale;
  host: string;
  port: number;
  origin: string;
  remoteTestManifestUrl: string;
};

type Source = Record<string, string | undefined>;

function required(source: Source, key: string): string {
  const value = source[key];

  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing required env key ${key} (set it in .env.local or the process environment)`,
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
    remoteTestManifestUrl: parseUrl(source, "REMOTE_TEST_MANIFEST_URL"),
  };
}
