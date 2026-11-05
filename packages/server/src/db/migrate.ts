import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";

import { loadDbEnv } from "../../env.ts";
import { createDatabase } from "./client.ts";

const { db, pool } = createDatabase(loadDbEnv());

try {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("./migrations", import.meta.url)) });
  console.log("Migrations applied");
} finally {
  await pool.end();
}
