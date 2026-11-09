import { federation } from "@module-federation/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { loadRemoteEnv } from "./env.ts";

const API_PREFIX = "/api/v1";

export default defineConfig(({ mode }) => {
  const env = loadRemoteEnv(mode);

  const apiProxy = {
    [API_PREFIX]: {
      target: env.apiUrl,
      changeOrigin: true,
      headers: env.devToken === undefined ? undefined : { Authorization: `Bearer ${env.devToken}` },
    },
  };

  return {
    base: `${env.publicOrigin}/`,
    optimizeDeps: { include: ["@mantine/core", "@mantine/hooks", "@mantine/charts", "recharts"] },
    plugins: [
      tailwindcss(),
      react(),
      federation({
        name: "insights",
        filename: "remoteEntry.js",
        manifest: true,
        exposes: { "./Insights": "./src/Insights.tsx" },
        shared: {
          react: { singleton: true },
          "react-dom": { singleton: true },
          "react-router": { singleton: true },
          "@tanstack/react-query": { singleton: true },
          "@mantine/core": { singleton: true },
          "@mantine/hooks": { singleton: true },
        },
      }),
    ],
    server: {
      host: env.host,
      port: env.port,
      strictPort: true,
      origin: env.publicOrigin,
      cors: { origin: env.allowedOrigins },
      proxy: apiProxy,
    },
    preview: {
      host: env.host,
      port: env.port,
      strictPort: true,
      cors: { origin: env.allowedOrigins },
    },
    build: { target: "esnext" },
  };
});
