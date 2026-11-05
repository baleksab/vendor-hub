import { sql } from "drizzle-orm";
import { char, check, pgEnum, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { USER_ROLES } from "../users/user-role.ts";
import { VENDOR_MEMBER_ROLES } from "../vendors/vendor-member-role.ts";
import { baseEntity, baseEntityChecks } from "./base-entity.ts";

export const userRoleEnum = pgEnum("user_role", USER_ROLES);

export const vendorMemberRoleEnum = pgEnum("vendor_member_role", VENDOR_MEMBER_ROLES);

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

export const vendors = pgTable(
  "vendors",
  {
    ...baseEntity,
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
  },
  (table) => [
    uniqueIndex("vendors_slug_unique")
      .on(sql`lower(${table.slug})`)
      .where(sql`${table.isDeleted} = false`),
    baseEntityChecks("vendors", table),
  ],
);

export const vendorMembers = pgTable(
  "vendor_members",
  {
    ...baseEntity,
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: vendorMemberRoleEnum("role").notNull(),
  },
  (table) => [
    uniqueIndex("vendor_members_owner_per_user_unique")
      .on(table.userId)
      .where(sql`${table.role} = 'owner' and ${table.isDeleted} = false`),
    uniqueIndex("vendor_members_owner_per_vendor_unique")
      .on(table.vendorId)
      .where(sql`${table.role} = 'owner' and ${table.isDeleted} = false`),
    uniqueIndex("vendor_members_vendor_user_unique")
      .on(table.vendorId, table.userId)
      .where(sql`${table.isDeleted} = false`),
    baseEntityChecks("vendor_members", table),
  ],
);
