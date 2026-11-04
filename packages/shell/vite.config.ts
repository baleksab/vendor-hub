import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

import { readShellEnv } from "./env.ts";

function installedVersion(packageName: string): string {
  const entry = createRequire(import.meta.url).resolve(packageName);
  const manifest = join(dirname(entry), "..", "package.json");

  return JSON.parse(readFileSync(manifest, "utf8")).version;
}

export default defineConfig(({ mode }) => {
  const env = readShellEnv({ ...loadEnv(mode, process.cwd(), ""), ...process.env });

  return {
    define: {
      MANTINE_VERSION: JSON.stringify(installedVersion("@mantine/core")),
    },
    optimizeDeps: { include: ["@mantine/core", "@mantine/hooks", "@module-federation/runtime"] },
    plugins: [tailwindcss(), reactRouter()],
    server: {
      host: env.host,
      port: env.port,
      strictPort: true,
    },
  };
});
