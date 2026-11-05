import { loadServerEnv } from "../env.ts";
import { buildApp } from "./app.ts";
import { createDatabase } from "./db/client.ts";
import { DrizzleUsersRepository } from "./users/users.repository.ts";
import { DrizzleVendorsRepository } from "./vendors/vendors.repository.ts";

const env = loadServerEnv();
const { db, pool } = createDatabase(env.db);

const app = await buildApp({
  logger: true,
  jwt: env.jwt,
  usersRepository: new DrizzleUsersRepository(db),
  vendorsRepository: new DrizzleVendorsRepository(db),
  checkDatabase: async () => {
    await pool.query("select 1");
  },
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void app
      .close()
      .then(() => pool.end())
      .then(() => process.exit(0));
  });
}

await app.listen({ host: env.host, port: env.port });
