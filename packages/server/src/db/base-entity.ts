import { sql, type SQL } from "drizzle-orm";
import { boolean, check, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";

export const baseEntity = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

type BaseEntityColumns = {
  isDeleted: AnyPgColumn;
  deletedAt: AnyPgColumn;
};

export function baseEntityChecks(name: string, table: BaseEntityColumns) {
  return check(
    `${name}_deleted_consistent`,
    sql`${table.isDeleted} = (${table.deletedAt} is not null)`,
  );
}

export function notDeleted(table: { isDeleted: AnyPgColumn }): SQL {
  return sql`${table.isDeleted} = false`;
}
