export type ServerEnv = {
  host: string;
  port: number;
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

export function loadServerEnv(source: Source = process.env): ServerEnv {
  return {
    host: required(source, "SERVER_HOST"),
    port: parsePort(source, "SERVER_PORT"),
  };
}
