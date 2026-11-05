import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

import { loadEnv } from "vite";

const SECRET_FILE = ".env.secret";

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

function stringEntries(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}

function readSecrets(): Record<string, string> {
  const file = join(process.cwd(), SECRET_FILE);

  return existsSync(file) ? stringEntries(parseEnv(readFileSync(file, "utf8"))) : {};
}

export function loadRemoteEnv(mode: string) {
  const source = {
    ...loadEnv(mode, process.cwd(), ""),
    ...readSecrets(),
    ...stringEntries(process.env),
  };
  const allowedKey = "USER_ADMINISTRATOR_ALLOWED_ORIGINS";
  const devToken = source["USER_ADMINISTRATOR_DEV_TOKEN"]?.trim();

  return {
    host: required(source, "USER_ADMINISTRATOR_HOST"),
    port: parsePort(source, "USER_ADMINISTRATOR_PORT"),
    publicOrigin: parseOrigin(source, "USER_ADMINISTRATOR_PUBLIC_ORIGIN"),
    allowedOrigins: required(source, allowedKey)
      .split(",")
      .map((origin) => parseOriginValue(allowedKey, origin.trim())),
    apiUrl: parseOrigin(source, "USER_ADMINISTRATOR_API_URL"),
    devToken: devToken === "" ? undefined : devToken,
  };
}
