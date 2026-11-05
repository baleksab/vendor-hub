import { defineConfig } from "vitest/config";

export default defineConfig({
  define: { MANTINE_VERSION: JSON.stringify("test") },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
