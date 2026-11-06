import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

import { readShellEnv } from "./env.ts";

function installedVersion(packageName: string): string {
  let directory = dirname(createRequire(import.meta.url).resolve(packageName));

  while (true) {
    const manifest = join(directory, "package.json");

    if (existsSync(manifest)) {
      const content = JSON.parse(readFileSync(manifest, "utf8"));

      if (content.name === packageName) {
        return content.version;
      }
    }

    directory = dirname(directory);
  }
}

export default defineConfig(({ mode }) => {
  const env = readShellEnv({ ...loadEnv(mode, process.cwd(), ""), ...process.env });

  return {
    define: {
      MANTINE_VERSION: JSON.stringify(installedVersion("@mantine/core")),
      REACT_ROUTER_VERSION: JSON.stringify(installedVersion("react-router")),
      REACT_QUERY_VERSION: JSON.stringify(installedVersion("@tanstack/react-query")),
    },
    optimizeDeps: {
      include: [
        "@mantine/core",
        "@mantine/hooks",
        "@module-federation/runtime",
        "@tanstack/react-query",
      ],
    },
    plugins: [tailwindcss(), reactRouter()],
    server: {
      host: env.host,
      port: env.port,
      strictPort: true,
    },
  };
});
