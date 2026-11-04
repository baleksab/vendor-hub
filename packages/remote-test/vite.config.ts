import { federation } from "@module-federation/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { loadRemoteEnv } from "./env.ts";

export default defineConfig(({ mode }) => {
  const env = loadRemoteEnv(mode);

  return {
    base: `${env.publicOrigin}/`,
    optimizeDeps: { include: ["@mantine/core", "@mantine/hooks"] },
    plugins: [
      tailwindcss(),
      react(),
      federation({
        name: "remote-test",
        filename: "remoteEntry.js",
        manifest: true,
        exposes: { "./Widget": "./src/Widget.tsx" },
        shared: {
          react: { singleton: true },
          "react-dom": { singleton: true },
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
