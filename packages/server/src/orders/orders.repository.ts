import { and, asc, count, desc, eq, lt, notInArray, sql, type SQL } from "drizzle-orm";

import { notDeleted } from "../db/base-entity.ts";
import type { Database, Transaction } from "../db/client.ts";
import { orderEvents, orderItems, orders, payments, vendors } from "../db/schema.ts";
import { findUniqueViolation } from "../db/unique-violation.ts";
import type { Currency } from "../products/currencies.ts";
import { decrementStock, incrementStock } from "../products/stock.ts";
import type {
  CreateOrdersResult,
  NewOrders,
  Order,
  OrderChange,
  OrderListQuery,
  OrderSummary,
  StaleChange,
  StaleOrder,
  StaleOutcome,
  StaleQuery,
} from "./order.ts";

export type OrdersRepository = {
  createOrders(input: NewOrders): Promise<CreateOrdersResult>;
  findIdsByIdempotencyKey(userId: string, idempotencyKey: string): Promise<string[]>;
  findById(id: string): Promise<Order | undefined>;
  listForBuyer(
    userId: string,
    query: OrderListQuery,
  ): Promise<{ items: OrderSummary[]; total: number }>;
  listForVendor(
    vendorId: string,
    query: OrderListQuery,
  ): Promise<{ items: OrderSummary[]; total: number }>;
  applyChange(change: OrderChange): Promise<boolean>;
  applyToNextStale(
    query: StaleQuery,
    build: (order: StaleOrder) => StaleChange,
  ): Promise<StaleOutcome | null>;
};

class OutOfStock extends Error {}

const itemCount = sql<number>`(
  select coalesce(sum(${orderItems.quantity}), 0)::int from ${orderItems}
  where ${orderItems.orderId} = ${orders.id} and ${orderItems.isDeleted} = false
)`;

const summaryColumns = {
  id: orders.id,
  userId: orders.userId,
  vendorId: orders.vendorId,
  vendorSlug: vendors.slug,
  vendorName: vendors.name,
  status: orders.status,
  currency: orders.currency,
  totalMinor: orders.totalMinor,
  itemCount,
  shipFirstName: orders.shipFirstName,
  shipLastName: orders.shipLastName,
  createdAt: orders.createdAt,
};

type SummaryRow = {
  shipFirstName: string;
  shipLastName: string;
  currency: string;
} & Omit<OrderSummary, "buyerName" | "currency">;

function toSummary({ shipFirstName, shipLastName, currency, ...row }: SummaryRow): OrderSummary {
  return { ...row, currency: currency as Currency, buyerName: `${shipFirstName} ${shipLastName}` };
}

const STALE_COLUMN = {
  created: orders.createdAt,
  delivered: orders.deliveredAt,
} as const;

export class DrizzleOrdersRepository implements OrdersRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async createOrders(input: NewOrders): Promise<CreateOrdersResult> {
    try {
      const orderIds = await this.db.transaction(async (tx) => {
        const ids: string[] = [];

        for (const order of input.orders) {
          for (const item of order.items) {
            if (!(await decrementStock(tx, item.productId, item.quantity))) {
              throw new OutOfStock();
            }
          }

          const [created] = await tx
            .insert(orders)
            .values({
              userId: input.userId,
              vendorId: order.vendorId,
              currency: order.currency,
              totalMinor: order.totalMinor,
              idempotencyKey: input.idempotencyKey,
              shipFirstName: input.shipping.firstName,
              shipLastName: input.shipping.lastName,
              shipEmail: input.shipping.email,
              shipPhone: input.shipping.phoneNumber,
              shipAddress: input.shipping.address,
              shipCountry: input.shipping.country,
            })
            .returning({ id: orders.id });

          if (created === undefined) {
            throw new Error("Insert returned no row");
          }

          await tx
            .insert(orderItems)
            .values(order.items.map((item) => ({ ...item, orderId: created.id })));

          await tx.insert(orderEvents).values({
            orderId: created.id,
            fromStatus: null,
            toStatus: "created",
            actor: "buyer",
            actorUserId: input.userId,
          });

          ids.push(created.id);
        }

        return ids;
      });

      return { kind: "created", orderIds };
    } catch (error) {
      if (error instanceof OutOfStock) {
        return { kind: "outOfStock" };
      }

      if (findUniqueViolation(error) !== undefined) {
        return { kind: "duplicate" };
      }

      throw error;
    }
  }

  async findIdsByIdempotencyKey(userId: string, idempotencyKey: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.idempotencyKey, idempotencyKey),
          notDeleted(orders),
        ),
      )
      .orderBy(asc(orders.createdAt), asc(orders.id));

    return rows.map((row) => row.id);
  }

  async findById(id: string): Promise<Order | undefined> {
    const [row] = await this.db
      .select({
        ...summaryColumns,
        shipEmail: orders.shipEmail,
        shipPhone: orders.shipPhone,
        shipAddress: orders.shipAddress,
        shipCountry: orders.shipCountry,
        paymentAttempts: orders.paymentAttempts,
        paidAt: orders.paidAt,
        deliveredAt: orders.deliveredAt,
        closedAt: orders.closedAt,
        cancelledAt: orders.cancelledAt,
      })
      .from(orders)
      .innerJoin(vendors, eq(vendors.id, orders.vendorId))
      .where(and(eq(orders.id, id), notDeleted(orders)));

    if (row === undefined) {
      return undefined;
    }

    const [items, paymentRows, events] = await Promise.all([
      this.db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          name: orderItems.name,
          unitPriceMinor: orderItems.unitPriceMinor,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(and(eq(orderItems.orderId, id), notDeleted(orderItems)))
        .orderBy(asc(orderItems.createdAt), asc(orderItems.id)),
      this.db
        .select({
          id: payments.id,
          kind: payments.kind,
          status: payments.status,
          amountMinor: payments.amountMinor,
          currency: payments.currency,
          failureReason: payments.failureReason,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .where(and(eq(payments.orderId, id), notDeleted(payments)))
        .orderBy(asc(payments.createdAt), asc(payments.id)),
      this.db
        .select({
          id: orderEvents.id,
          fromStatus: orderEvents.fromStatus,
          toStatus: orderEvents.toStatus,
          actor: orderEvents.actor,
          note: orderEvents.note,
          createdAt: orderEvents.createdAt,
        })
        .from(orderEvents)
        .where(and(eq(orderEvents.orderId, id), notDeleted(orderEvents)))
        .orderBy(asc(orderEvents.createdAt), asc(orderEvents.id)),
    ]);

    const { shipEmail, shipPhone, shipAddress, shipCountry, ...rest } = row;

    return {
      ...toSummary(rest),
      paymentAttempts: rest.paymentAttempts,
      paidAt: rest.paidAt,
      deliveredAt: rest.deliveredAt,
      closedAt: rest.closedAt,
      cancelledAt: rest.cancelledAt,
      shipping: {
        firstName: rest.shipFirstName,
        lastName: rest.shipLastName,
        email: shipEmail,
        phoneNumber: shipPhone,
        address: shipAddress,
        country: shipCountry,
      },
      items,
      payments: paymentRows.map((payment) => ({
        ...payment,
        currency: payment.currency as Currency,
      })),
      events,
    };
  }

  listForBuyer(
    userId: string,
    query: OrderListQuery,
  ): Promise<{ items: OrderSummary[]; total: number }> {
    return this.list(eq(orders.userId, userId), query);
  }

  listForVendor(
    vendorId: string,
    query: OrderListQuery,
  ): Promise<{ items: OrderSummary[]; total: number }> {
    return this.list(eq(orders.vendorId, vendorId), query);
  }

  applyChange(change: OrderChange): Promise<boolean> {
    return this.db.transaction((tx) => applyInTransaction(tx, change));
  }

  async applyToNextStale(
    query: StaleQuery,
    build: (order: StaleOrder) => StaleChange,
  ): Promise<StaleOutcome | null> {
    let picked: string | null = null;

    try {
      await this.db.transaction(async (tx) => {
        const column = STALE_COLUMN[query.status];
        const conditions: (SQL | undefined)[] = [
          eq(orders.status, query.status),
          lt(column, query.olderThan),
          notDeleted(orders),
        ];

        if (query.exclude.length > 0) {
          conditions.push(notInArray(orders.id, query.exclude));
        }

        const [row] = await tx
          .select({
            id: orders.id,
            status: orders.status,
            currency: orders.currency,
            totalMinor: orders.totalMinor,
          })
          .from(orders)
          .where(and(...conditions))
          .orderBy(asc(column))
          .limit(1)
          .for("update", { skipLocked: true });

        if (row === undefined) {
          return;
        }

        picked = row.id;

        const change = build({ ...row, currency: row.currency as Currency });

        if (!(await applyInTransaction(tx, { ...change, orderId: row.id, from: row.status }))) {
          throw new Error(`Order ${row.id} changed while it was locked`);
        }
      });
    } catch (error) {
      if (picked === null) {
        throw error;
      }

      return { id: picked, error };
    }

    return picked === null ? null : { id: picked, error: null };
  }

  private async list(
    owner: SQL,
    query: OrderListQuery,
  ): Promise<{ items: OrderSummary[]; total: number }> {
    const where = and(
      owner,
      notDeleted(orders),
      query.status === undefined ? undefined : eq(orders.status, query.status),
    );

    const rows = await this.db
      .select(summaryColumns)
      .from(orders)
      .innerJoin(vendors, eq(vendors.id, orders.vendorId))
      .where(where)
      .orderBy(desc(orders.createdAt), asc(orders.id))
      .limit(query.limit)
      .offset(query.offset);

    const [totalRow] = await this.db.select({ total: count() }).from(orders).where(where);

    return { items: rows.map(toSummary), total: totalRow?.total ?? 0 };
  }
}

async function applyInTransaction(tx: Transaction, change: OrderChange): Promise<boolean> {
  const updated = await tx
    .update(orders)
    .set({
      status: change.to,
      ...(change.countPaymentAttempt
        ? { paymentAttempts: sql`${orders.paymentAttempts} + 1` }
        : {}),
      ...(change.timestamp === null ? {} : { [change.timestamp]: sql`now()` }),
    })
    .where(and(eq(orders.id, change.orderId), eq(orders.status, change.from), notDeleted(orders)))
    .returning({ id: orders.id });

  if (updated.length === 0) {
    return false;
  }

  if (change.payment !== null) {
    await tx.insert(payments).values({ ...change.payment, orderId: change.orderId });
  }

  await tx.insert(orderEvents).values({
    orderId: change.orderId,
    fromStatus: change.from,
    toStatus: change.to,
    actor: change.actor,
    actorUserId: change.actorUserId,
    note: change.note,
  });

  if (change.restoreStock) {
    const items = await tx
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(and(eq(orderItems.orderId, change.orderId), notDeleted(orderItems)));

    for (const item of items) {
      await incrementStock(tx, item.productId, item.quantity);
    }
  }

  return true;
}
