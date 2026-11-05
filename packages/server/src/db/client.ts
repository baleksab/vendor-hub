import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import type { DbEnv } from "../../env.ts";
import * as schema from "./schema.ts";

export type Database = NodePgDatabase<typeof schema>;

export type DatabaseHandle = {
  db: Database;
  pool: pg.Pool;
};

export function createDatabase(env: DbEnv): DatabaseHandle {
  const pool = new pg.Pool({
    host: env.host,
    port: env.port,
    database: env.name,
    user: env.user,
    password: env.password,
  });

  return { db: drizzle(pool, { schema }), pool };
}
