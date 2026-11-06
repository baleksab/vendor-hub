import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import pg from "pg";
import { fileURLToPath } from "node:url";

import { loadDbEnv } from "../../env.ts";
import { createDatabase, type DatabaseHandle } from "../db/client.ts";

export async function createTestDatabase(): Promise<DatabaseHandle> {
  const env = loadDbEnv();
  const testName = `${env.name}_test`;

  const admin = new pg.Client({
    host: env.host,
    port: env.port,
    database: env.name,
    user: env.user,
    password: env.password,
  });

  await admin.connect();

  try {
    const existing = await admin.query("select 1 from pg_database where datname = $1", [testName]);

    if (existing.rowCount === 0) {
      await admin.query(`create database ${admin.escapeIdentifier(testName)}`);
    }
  } finally {
    await admin.end();
  }

  const handle = createDatabase({ ...env, name: testName });

  await migrate(handle.db, {
    migrationsFolder: fileURLToPath(new URL("../db/migrations", import.meta.url)),
  });

  return handle;
}

export async function truncateAll(handle: DatabaseHandle): Promise<void> {
  await handle.db.execute(
    sql`truncate table order_events, payments, order_items, orders, product_reviews, vendor_reviews, product_images, products, vendor_members, vendors, users`,
  );
}
