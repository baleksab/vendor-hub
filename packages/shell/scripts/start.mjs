import { spawn } from "node:child_process";

function required(key) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing required env key ${key} (set it in .env.local or the process environment)`,
    );
  }

  return value;
}

const host = required("SHELL_HOST");
const port = required("SHELL_PORT");

required("SHELL_ORIGIN");
required("DEFAULT_LOCALE");
required("USER_ADMINISTRATOR_MANIFEST_URL");
required("API_URL");
required("SESSION_COOKIE_NAME");
required("SESSION_COOKIE_SECURE");

const child = spawn("react-router-serve", ["./build/server/index.js"], {
  stdio: "inherit",
  env: { ...process.env, HOST: host, PORT: port },
});

child.on("exit", (code) => process.exit(code ?? 1));
