export type TypesEnv = {
  openapiUrl: URL;
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

function parseUrl(source: Source, key: string): URL {
  const raw = required(source, key);

  try {
    return new URL(raw);
  } catch {
    throw new Error(`Env key ${key} must be a valid URL, got "${raw}"`);
  }
}

export function loadTypesEnv(source: Source = process.env): TypesEnv {
  return {
    openapiUrl: parseUrl(source, "OPENAPI_URL"),
  };
}
