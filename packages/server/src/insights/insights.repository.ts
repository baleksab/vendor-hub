import { and, asc, count, desc, eq, gte, ilike, inArray, lt, or, sql, type SQL } from "drizzle-orm";

import { notDeleted } from "../db/base-entity.ts";
import type { Database } from "../db/client.ts";
import {
  orderItems,
  orders,
  productReviews,
  products,
  vendorMembers,
  vendors,
} from "../db/schema.ts";
import type { Currency } from "../products/currencies.ts";
import { escapeLike } from "../shared/like.ts";
import type {
  CatalogStats,
  CountPoint,
  CurrencyUsage,
  InsightsRepository,
  InsightsScope,
  InsightsVendorQuery,
  InsightsVendorRow,
  RatingBucket,
  RevenuePoint,
  SalesPoint,
  Slice,
  StatusCount,
  TopCountry,
  TopProduct,
  Totals,
} from "./insight.ts";
import type { BucketUnit, InsightWindow } from "./insights.period.ts";
import { PAID_STATUSES, REFUNDED_STATUS } from "./revenue-statuses.ts";

const paidStatus = inArray(orders.status, [...PAID_STATUSES]);
const isRefunded = sql`${orders.status} = ${REFUNDED_STATUS}`;
const isNet = sql`${orders.status} <> ${REFUNDED_STATUS}`;
const paidStatusList = sql.join(
  PAID_STATUSES.map((status) => sql`${status}`),
  sql`, `,
);

const toNumber = (value: unknown): number => Number(value);

function inWindow(column: SQL.Aliased | SQL | Parameters<typeof gte>[0], window: InsightWindow) {
  return and(window.from === null ? undefined : gte(column, window.from), lt(column, window.to));
}

function inWindowSql(column: SQL, window: InsightWindow): SQL {
  const upper = sql`${column} < ${window.to.toISOString()}`;

  return window.from === null ? upper : sql`${column} >= ${window.from.toISOString()} and ${upper}`;
}

function bucketOf(column: SQL | Parameters<typeof gte>[0], unit: BucketUnit) {
  return sql<string>`to_char(date_trunc(${sql.raw(`'${unit}'`)}, ${column} at time zone 'UTC'), 'YYYY-MM-DD')`;
}

function orderConditions(vendorId: string, slice: Slice): (SQL | undefined)[] {
  return [
    eq(orders.vendorId, vendorId),
    eq(orders.currency, slice.currency),
    paidStatus,
    notDeleted(orders),
    inWindow(orders.paidAt, slice.window),
  ];
}

function itemConditions(productId: string, slice: Slice): (SQL | undefined)[] {
  return [
    eq(orderItems.productId, productId),
    eq(orders.currency, slice.currency),
    paidStatus,
    notDeleted(orders),
    notDeleted(orderItems),
    inWindow(orders.paidAt, slice.window),
  ];
}

export class DrizzleInsightsRepository implements InsightsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async currencies(scope: InsightsScope): Promise<CurrencyUsage[]> {
    const rows = await this.db
      .select({ currency: orders.currency, orders: count() })
      .from(orders)
      .where(and(paidStatus, notDeleted(orders), this.scopeCondition(scope)))
      .groupBy(orders.currency)
      .orderBy(desc(count()), asc(orders.currency));

    return rows.map((row) => ({ currency: row.currency as Currency, orders: row.orders }));
  }

  async listVendors(
    query: InsightsVendorQuery,
  ): Promise<{ items: InsightsVendorRow[]; total: number }> {
    const productCount = sql<number>`(
      select count(*) from ${products}
      where ${products.vendorId} = ${vendors.id} and ${products.isDeleted} = false
    )`.mapWith(toNumber);
    const orderCount = sql<number>`(
      select count(*) from ${orders}
      where ${orders.vendorId} = ${vendors.id} and ${orders.currency} = ${query.currency}
        and ${orders.isDeleted} = false and ${orders.status} in (${paidStatusList})
        and ${inWindowSql(sql`${orders.paidAt}`, query.current)}
    )`.mapWith(toNumber);
    const netIn = (window: InsightWindow) =>
      sql<number>`(
        select coalesce(sum(${orders.totalMinor}), 0) from ${orders}
        where ${orders.vendorId} = ${vendors.id} and ${orders.currency} = ${query.currency}
          and ${orders.isDeleted} = false and ${orders.status} in (${paidStatusList})
          and ${orders.status} <> ${REFUNDED_STATUS}
          and ${inWindowSql(sql`${orders.paidAt}`, window)}
      )`.mapWith(toNumber);
    const net = netIn(query.current);
    const previousNet = query.previous === null ? sql<number>`0` : netIn(query.previous);

    const conditions: (SQL | undefined)[] = [notDeleted(vendors), notDeleted(vendorMembers)];

    if (query.relation !== undefined) {
      conditions.push(eq(vendorMembers.role, query.relation === "owned" ? "owner" : "operator"));
    }

    if (query.search !== undefined) {
      const pattern = `%${escapeLike(query.search)}%`;

      conditions.push(or(ilike(vendors.name, pattern), ilike(vendors.slug, pattern)));
    }

    const where = and(eq(vendorMembers.userId, query.userId), ...conditions);
    const sortColumn = {
      revenue: net,
      orders: orderCount,
      products: productCount,
      rating: vendors.ratingAvg,
      name: vendors.name,
    }[query.sort];
    const direction = query.direction === "asc" ? asc : desc;

    const items = await this.db
      .select({
        id: vendors.id,
        slug: vendors.slug,
        name: vendors.name,
        viewerRole: vendorMembers.role,
        productCount,
        orderCount,
        netMinor: net,
        previousNetMinor: previousNet.mapWith(toNumber),
        ratingAvg: vendors.ratingAvg,
        ratingCount: vendors.ratingCount,
      })
      .from(vendors)
      .innerJoin(vendorMembers, eq(vendorMembers.vendorId, vendors.id))
      .where(where)
      .orderBy(direction(sortColumn), asc(vendors.id))
      .limit(query.limit)
      .offset(query.offset);

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(vendors)
      .innerJoin(vendorMembers, eq(vendorMembers.vendorId, vendors.id))
      .where(where);

    return { items, total: totalRow?.total ?? 0 };
  }

  async vendorTotals(vendorId: string, slice: Slice): Promise<Totals> {
    const conditions = orderConditions(vendorId, slice);

    const [totals] = await this.db
      .select({
        grossMinor: sql<number>`coalesce(sum(${orders.totalMinor}), 0)`.mapWith(toNumber),
        refundedMinor:
          sql<number>`coalesce(sum(${orders.totalMinor}) filter (where ${isRefunded}), 0)`.mapWith(
            toNumber,
          ),
        orders: count(),
        refundedOrders: sql<number>`count(*) filter (where ${isRefunded})`.mapWith(toNumber),
      })
      .from(orders)
      .where(and(...conditions));

    const [units] = await this.db
      .select({
        units: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`.mapWith(toNumber),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(notDeleted(orderItems), ...conditions));

    return {
      grossMinor: totals?.grossMinor ?? 0,
      refundedMinor: totals?.refundedMinor ?? 0,
      orders: totals?.orders ?? 0,
      refundedOrders: totals?.refundedOrders ?? 0,
      units: units?.units ?? 0,
    };
  }

  async vendorRevenueSeries(
    vendorId: string,
    slice: Slice,
    unit: BucketUnit,
  ): Promise<RevenuePoint[]> {
    const bucket = bucketOf(sql`${orders.paidAt}`, unit);

    return this.db
      .select({
        bucket,
        netMinor:
          sql<number>`coalesce(sum(${orders.totalMinor}) filter (where ${isNet}), 0)`.mapWith(
            toNumber,
          ),
        orders: count(),
      })
      .from(orders)
      .where(and(...orderConditions(vendorId, slice)))
      .groupBy(bucket)
      .orderBy(asc(bucket));
  }

  async vendorOrdersByStatus(vendorId: string, slice: Slice): Promise<StatusCount[]> {
    return this.db
      .select({ status: orders.status, count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.vendorId, vendorId),
          eq(orders.currency, slice.currency),
          notDeleted(orders),
          inWindow(orders.createdAt, slice.window),
        ),
      )
      .groupBy(orders.status)
      .orderBy(desc(count()), asc(orders.status));
  }

  async vendorTopProducts(vendorId: string, slice: Slice, limit: number): Promise<TopProduct[]> {
    const net = sql<number>`coalesce(sum(${orderItems.unitPriceMinor} * ${orderItems.quantity}) filter (where ${isNet}), 0)`;

    const rows = await this.db
      .select({
        productId: orderItems.productId,
        name: sql<string>`max(${orderItems.name})`,
        unitsSold:
          sql<number>`coalesce(sum(${orderItems.quantity}) filter (where ${isNet}), 0)`.mapWith(
            toNumber,
          ),
        netMinor: net.mapWith(toNumber),
        ratingAvg: sql<string | null>`max(${products.ratingAvg})`,
        available: sql<boolean>`bool_or(${products.id} is not null)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .leftJoin(products, and(eq(products.id, orderItems.productId), notDeleted(products)))
      .where(and(notDeleted(orderItems), ...orderConditions(vendorId, slice)))
      .groupBy(orderItems.productId)
      .orderBy(desc(net), asc(orderItems.productId))
      .limit(limit);

    return rows.map((row) => ({
      ...row,
      ratingAvg: row.ratingAvg === null ? null : Number(row.ratingAvg),
    }));
  }

  async vendorTopCountries(vendorId: string, slice: Slice, limit: number): Promise<TopCountry[]> {
    const net = sql<number>`coalesce(sum(${orders.totalMinor}) filter (where ${isNet}), 0)`;

    return this.db
      .select({
        country: orders.shipCountry,
        orders: count(),
        netMinor: net.mapWith(toNumber),
      })
      .from(orders)
      .where(and(...orderConditions(vendorId, slice)))
      .groupBy(orders.shipCountry)
      .orderBy(desc(count()), asc(orders.shipCountry))
      .limit(limit);
  }

  async vendorCatalog(vendorId: string): Promise<CatalogStats> {
    const [row] = await this.db
      .select({
        productCount: count(),
        outOfStockCount: sql<number>`count(*) filter (where ${products.stock} = 0)`.mapWith(
          toNumber,
        ),
      })
      .from(products)
      .where(and(eq(products.vendorId, vendorId), notDeleted(products)));

    return { productCount: row?.productCount ?? 0, outOfStockCount: row?.outOfStockCount ?? 0 };
  }

  async productTotals(productId: string, slice: Slice): Promise<Totals> {
    const line = sql`${orderItems.unitPriceMinor} * ${orderItems.quantity}`;

    const [row] = await this.db
      .select({
        grossMinor: sql<number>`coalesce(sum(${line}), 0)`.mapWith(toNumber),
        refundedMinor: sql<number>`coalesce(sum(${line}) filter (where ${isRefunded}), 0)`.mapWith(
          toNumber,
        ),
        orders: sql<number>`count(distinct ${orders.id})`.mapWith(toNumber),
        refundedOrders:
          sql<number>`count(distinct ${orders.id}) filter (where ${isRefunded})`.mapWith(toNumber),
        units: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`.mapWith(toNumber),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(...itemConditions(productId, slice)));

    return {
      grossMinor: row?.grossMinor ?? 0,
      refundedMinor: row?.refundedMinor ?? 0,
      orders: row?.orders ?? 0,
      refundedOrders: row?.refundedOrders ?? 0,
      units: row?.units ?? 0,
    };
  }

  async productSalesSeries(
    productId: string,
    slice: Slice,
    unit: BucketUnit,
  ): Promise<SalesPoint[]> {
    const bucket = bucketOf(sql`${orders.paidAt}`, unit);

    return this.db
      .select({
        bucket,
        netMinor:
          sql<number>`coalesce(sum(${orderItems.unitPriceMinor} * ${orderItems.quantity}) filter (where ${isNet}), 0)`.mapWith(
            toNumber,
          ),
        units:
          sql<number>`coalesce(sum(${orderItems.quantity}) filter (where ${isNet}), 0)`.mapWith(
            toNumber,
          ),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(...itemConditions(productId, slice)))
      .groupBy(bucket)
      .orderBy(asc(bucket));
  }

  async productRatingDistribution(productId: string): Promise<RatingBucket[]> {
    return this.db
      .select({ rating: productReviews.rating, count: count() })
      .from(productReviews)
      .where(and(eq(productReviews.targetId, productId), notDeleted(productReviews)))
      .groupBy(productReviews.rating)
      .orderBy(asc(productReviews.rating));
  }

  async productReviewsSeries(
    productId: string,
    window: InsightWindow,
    unit: BucketUnit,
  ): Promise<CountPoint[]> {
    const bucket = bucketOf(sql`${productReviews.createdAt}`, unit);

    return this.db
      .select({ bucket, count: count() })
      .from(productReviews)
      .where(
        and(
          eq(productReviews.targetId, productId),
          notDeleted(productReviews),
          inWindow(productReviews.createdAt, window),
        ),
      )
      .groupBy(bucket)
      .orderBy(asc(bucket));
  }

  private scopeCondition(scope: InsightsScope): SQL {
    if (scope.kind === "vendor") {
      return eq(orders.vendorId, scope.vendorId);
    }

    if (scope.kind === "product") {
      return inArray(
        orders.id,
        this.db
          .select({ id: orderItems.orderId })
          .from(orderItems)
          .where(and(eq(orderItems.productId, scope.productId), notDeleted(orderItems))),
      );
    }

    return inArray(
      orders.vendorId,
      this.db
        .select({ id: vendorMembers.vendorId })
        .from(vendorMembers)
        .where(and(eq(vendorMembers.userId, scope.userId), notDeleted(vendorMembers))),
    );
  }
}
