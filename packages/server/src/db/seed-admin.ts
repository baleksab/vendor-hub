import { and, sql } from "drizzle-orm";

import { loadSeedEnv } from "../../env.ts";
import { Argon2PasswordService } from "../auth/password.service.ts";
import { notDeleted } from "./base-entity.ts";
import { createDatabase } from "./client.ts";
import { users } from "./schema.ts";

const env = loadSeedEnv();
const { db, pool } = createDatabase(env.db);

try {
  const email = env.admin.email.toLowerCase();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(sql`lower(${users.email}) = ${email}`, notDeleted(users)));

  if (existing !== undefined) {
    console.log(`User ${email} already exists, nothing to do`);
  } else {
    await db.insert(users).values({
      email,
      passwordHash: await new Argon2PasswordService().hash(env.admin.password),
      firstName: env.admin.firstName,
      lastName: env.admin.lastName,
      address: env.admin.address,
      phoneNumber: env.admin.phoneNumber,
      country: env.admin.country,
      role: "administrator",
    });
    console.log(`Administrator ${email} created`);
  }
} finally {
  await pool.end();
}
