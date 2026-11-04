import { loadServerEnv } from "../env.ts";
import { buildApp } from "./app.ts";

const env = loadServerEnv();
const app = await buildApp({ logger: true });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
}

await app.listen({ host: env.host, port: env.port });
