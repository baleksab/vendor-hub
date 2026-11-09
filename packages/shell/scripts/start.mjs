import { spawn } from "node:child_process";

function required(key) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing required env key ${key} (set it in .env.local, .env.secret or the process environment)`,
    );
  }

  return value;
}

const host = required("SHELL_HOST");
const port = required("SHELL_PORT");

required("SHELL_ORIGIN");
required("DEFAULT_LOCALE");
required("USER_ADMINISTRATOR_MANIFEST_URL");
required("VENDOR_ADMINISTRATOR_MANIFEST_URL");
required("INSIGHTS_MANIFEST_URL");
required("API_URL");
required("SESSION_COOKIE_NAME");
required("SESSION_COOKIE_SECURE");
required("SHELL_SESSION_SECRET");
required("CART_COOKIE_NAME");
required("CART_MAX_LINES");
required("CART_MAX_QUANTITY_PER_LINE");

const child = spawn("react-router-serve", ["./build/server/index.js"], {
  stdio: "inherit",
  env: { ...process.env, HOST: host, PORT: port },
});

child.on("exit", (code) => process.exit(code ?? 1));
