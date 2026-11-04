import { sql } from "drizzle-orm";
import { char, check, pgEnum, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { USER_ROLES } from "../users/user-role.ts";
import { baseEntity, baseEntityChecks } from "./base-entity.ts";

export const userRoleEnum = pgEnum("user_role", USER_ROLES);

export const users = pgTable(
  "users",
  {
    ...baseEntity,
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    address: text("address").notNull(),
    phoneNumber: text("phone_number").notNull(),
    country: char("country", { length: 2 }).notNull(),
    role: userRoleEnum("role").notNull().default("regular"),
  },
  (table) => [
    uniqueIndex("users_email_unique")
      .on(sql`lower(${table.email})`)
      .where(sql`${table.isDeleted} = false`),
    check("users_country_format", sql`${table.country} ~ '^[A-Z]{2}$'`),
    baseEntityChecks("users", table),
  ],
);
