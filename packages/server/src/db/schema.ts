import { sql } from "drizzle-orm";
import {
  char,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  timestamp,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { ORDER_ACTORS, ORDER_STATUSES } from "../orders/order-status.ts";
import { PAYMENT_FAILURE_REASONS, PAYMENT_KINDS, PAYMENT_STATUSES } from "../payments/payment.ts";
import { USER_ROLES } from "../users/user-role.ts";
import { VENDOR_MEMBER_ROLES } from "../vendors/vendor-member-role.ts";
import { baseEntity, baseEntityChecks } from "./base-entity.ts";

export const userRoleEnum = pgEnum("user_role", USER_ROLES);

export const vendorMemberRoleEnum = pgEnum("vendor_member_role", VENDOR_MEMBER_ROLES);

export const orderStatusEnum = pgEnum("order_status", ORDER_STATUSES);

export const orderActorEnum = pgEnum("order_actor", ORDER_ACTORS);

export const paymentKindEnum = pgEnum("payment_kind", PAYMENT_KINDS);

export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);

export const paymentFailureReasonEnum = pgEnum("payment_failure_reason", PAYMENT_FAILURE_REASONS);

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
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    ratingCount: integer("rating_count").notNull().default(0),
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

export const products = pgTable(
  "products",
  {
    ...baseEntity,
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id),
    category: text("category").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    priceMinor: integer("price_minor").notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    stock: integer("stock").notNull(),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    ratingCount: integer("rating_count").notNull().default(0),
  },
  (table) => [
    index("products_vendor_category_idx").on(table.vendorId, table.category),
    index("products_vendor_created_idx").on(table.vendorId, sql`${table.createdAt} desc`),
    index("products_rating_idx").on(table.ratingAvg),
    index("products_name_trgm_idx").using("gin", sql`lower(${table.name}) gin_trgm_ops`),
    check("products_price_non_negative", sql`${table.priceMinor} >= 0`),
    check("products_stock_non_negative", sql`${table.stock} >= 0`),
    check("products_currency_format", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    baseEntityChecks("products", table),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    ...baseEntity,
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    position: integer("position").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
  },
  (table) => [
    uniqueIndex("product_images_position_unique")
      .on(table.productId, table.position)
      .where(sql`${table.isDeleted} = false`),
    baseEntityChecks("product_images", table),
  ],
);

function reviewTable(name: string, targetColumn: string, target: () => AnyPgColumn) {
  return pgTable(
    name,
    {
      ...baseEntity,
      targetId: uuid(targetColumn).notNull().references(target),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id),
      rating: integer("rating").notNull(),
      comment: text("comment"),
    },
    (table) => [
      uniqueIndex(`${name}_user_unique`)
        .on(table.targetId, table.userId)
        .where(sql`${table.isDeleted} = false`),
      index(`${name}_target_created_idx`).on(table.targetId, sql`${table.createdAt} desc`),
      check(`${name}_rating_range`, sql`${table.rating} between 1 and 5`),
      baseEntityChecks(name, table),
    ],
  );
}

export const productReviews = reviewTable("product_reviews", "product_id", () => products.id);

export const vendorReviews = reviewTable("vendor_reviews", "vendor_id", () => vendors.id);

const timestampTz = (name: string) => timestamp(name, { withTimezone: true });

export const orders = pgTable(
  "orders",
  {
    ...baseEntity,
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id),
    status: orderStatusEnum("status").notNull().default("created"),
    currency: char("currency", { length: 3 }).notNull(),
    totalMinor: integer("total_minor").notNull(),
    idempotencyKey: uuid("idempotency_key").notNull(),
    shipFirstName: text("ship_first_name").notNull(),
    shipLastName: text("ship_last_name").notNull(),
    shipEmail: text("ship_email").notNull(),
    shipPhone: text("ship_phone").notNull(),
    shipAddress: text("ship_address").notNull(),
    shipCountry: char("ship_country", { length: 2 }).notNull(),
    paymentAttempts: integer("payment_attempts").notNull().default(0),
    paidAt: timestampTz("paid_at"),
    deliveredAt: timestampTz("delivered_at"),
    closedAt: timestampTz("closed_at"),
    cancelledAt: timestampTz("cancelled_at"),
  },
  (table) => [
    uniqueIndex("orders_idempotency_unique")
      .on(table.userId, table.idempotencyKey, table.vendorId, table.currency)
      .where(sql`${table.isDeleted} = false`),
    index("orders_user_created_idx").on(table.userId, sql`${table.createdAt} desc`),
    index("orders_vendor_status_created_idx").on(
      table.vendorId,
      table.status,
      sql`${table.createdAt} desc`,
    ),
    index("orders_status_created_idx").on(table.status, table.createdAt),
    index("orders_status_delivered_idx").on(table.status, table.deliveredAt),
    check("orders_total_non_negative", sql`${table.totalMinor} >= 0`),
    check("orders_payment_attempts_non_negative", sql`${table.paymentAttempts} >= 0`),
    check("orders_currency_format", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check("orders_ship_country_format", sql`${table.shipCountry} ~ '^[A-Z]{2}$'`),
    baseEntityChecks("orders", table),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    ...baseEntity,
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    name: text("name").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} >= 1`),
    check("order_items_unit_price_non_negative", sql`${table.unitPriceMinor} >= 0`),
    baseEntityChecks("order_items", table),
  ],
);

export const payments = pgTable(
  "payments",
  {
    ...baseEntity,
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    kind: paymentKindEnum("kind").notNull(),
    status: paymentStatusEnum("status").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: char("currency", { length: 3 }).notNull(),
    failureReason: paymentFailureReasonEnum("failure_reason"),
  },
  (table) => [
    index("payments_order_created_idx").on(table.orderId, table.createdAt),
    check("payments_amount_non_negative", sql`${table.amountMinor} >= 0`),
    check("payments_currency_format", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check(
      "payments_failure_reason_consistent",
      sql`(${table.status} = 'failed') = (${table.failureReason} is not null)`,
    ),
    baseEntityChecks("payments", table),
  ],
);

export const orderEvents = pgTable(
  "order_events",
  {
    ...baseEntity,
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    actor: orderActorEnum("actor").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    note: text("note"),
  },
  (table) => [
    index("order_events_order_created_idx").on(table.orderId, table.createdAt),
    check(
      "order_events_actor_consistent",
      sql`(${table.actor} = 'system') = (${table.actorUserId} is null)`,
    ),
    baseEntityChecks("order_events", table),
  ],
);
