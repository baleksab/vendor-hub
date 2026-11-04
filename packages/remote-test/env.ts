import { loadEnv } from "vite";

function required(source: Record<string, string>, key: string): string {
  const value = source[key];

  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing required env key ${key} (set it in .env.local or the process environment)`,
    );
  }

  return value.trim();
}

function parsePort(source: Record<string, string>, key: string): number {
  const raw = required(source, key);
  const port = Number(raw);

  if (!Number.isInteger(port) || port < 1 || port > 0xffff) {
    throw new Error(`Env key ${key} must be a port number, got "${raw}"`);
  }

  return port;
}

function parseOrigin(source: Record<string, string>, key: string): string {
  return parseOriginValue(key, required(source, key));
}

function parseOriginValue(key: string, raw: string): string {
  try {
    return new URL(raw).origin;
  } catch {
    throw new Error(`Env key ${key} must be a valid origin, got "${raw}"`);
  }
}

export function loadRemoteEnv(mode: string) {
  const source = { ...loadEnv(mode, process.cwd(), ""), ...stringEntries(process.env) };
  const allowedKey = "REMOTE_TEST_ALLOWED_ORIGINS";

  return {
    host: required(source, "REMOTE_TEST_HOST"),
    port: parsePort(source, "REMOTE_TEST_PORT"),
    publicOrigin: parseOrigin(source, "REMOTE_TEST_PUBLIC_ORIGIN"),
    allowedOrigins: required(source, allowedKey)
      .split(",")
      .map((origin) => parseOriginValue(allowedKey, origin.trim())),
  };
}

function stringEntries(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}
