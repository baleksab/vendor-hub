import { CURRENCIES, type Currency } from "../products/currencies.ts";
import type { ProductsRepository } from "../products/products.repository.ts";
import { NotFoundError } from "../shared/errors.ts";
import type { Actor } from "../vendors/vendor-access.ts";
import type { VendorsRepository } from "../vendors/vendors.repository.ts";
import { memberRoleOf } from "./insights-access.ts";
import type {
  InsightsRepository,
  InsightsScope,
  InsightsVendorRow,
  RatingBucket,
  Slice,
  Totals,
} from "./insight.ts";
import {
  bucketKeys,
  firstBucket,
  resolveWindows,
  type InsightPeriod,
  type PeriodWindows,
} from "./insights.period.ts";
import {
  resolveDirection,
  type InsightsDetailQuery,
  type InsightsVendorListQuery,
  type ProductInsightsResponse,
  type VendorInsightsResponse,
} from "./insights.schemas.ts";

type Clock = () => Date;

type Meta = { period: InsightPeriod; currency: Currency; currencies: Currency[] };

type Pair = { value: number; previous: number | null };

const TOP_LIMIT = 10;
const FALLBACK_CURRENCY = CURRENCIES[0];
const RATINGS = [1, 2, 3, 4, 5] as const;

export type InsightsVendorList = {
  items: InsightsVendorRow[];
  total: number;
  meta: Meta;
  hasPrevious: boolean;
};

export class InsightsService {
  private readonly insights: InsightsRepository;
  private readonly vendors: VendorsRepository;
  private readonly products: ProductsRepository;
  private readonly clock: Clock;

  constructor(
    insights: InsightsRepository,
    vendors: VendorsRepository,
    products: ProductsRepository,
    clock: Clock,
  ) {
    this.insights = insights;
    this.vendors = vendors;
    this.products = products;
    this.clock = clock;
  }

  async listVendors(actor: Actor, query: InsightsVendorListQuery): Promise<InsightsVendorList> {
    const windows = resolveWindows(query.period, this.clock());
    const meta = await this.meta(
      { kind: "member", userId: actor.userId },
      query.period,
      query.currency,
    );
    const { items, total } = await this.insights.listVendors({
      userId: actor.userId,
      search: query.search,
      relation: query.relation,
      sort: query.sort,
      direction: resolveDirection(query),
      limit: query.limit,
      offset: query.offset,
      currency: meta.currency,
      current: windows.current,
      previous: windows.previous,
    });

    return { items, total, meta, hasPrevious: windows.previous !== null };
  }

  async vendorInsights(
    actor: Actor,
    vendorId: string,
    query: InsightsDetailQuery,
  ): Promise<VendorInsightsResponse> {
    const vendor = await this.vendors.findById(vendorId);

    const viewerRole = vendor && memberRoleOf(vendor, actor.userId);

    if (vendor === undefined || viewerRole === undefined) {
      throw new NotFoundError("Vendor not found");
    }

    const windows = resolveWindows(query.period, this.clock());
    const meta = await this.meta({ kind: "vendor", vendorId }, query.period, query.currency);
    const slice: Slice = { currency: meta.currency, window: windows.current };
    const previousSlice = windows.previous && { ...slice, window: windows.previous };

    const [totals, previous, series, byStatus, topProducts, topCountries, catalog] =
      await Promise.all([
        this.insights.vendorTotals(vendorId, slice),
        previousSlice ? this.insights.vendorTotals(vendorId, previousSlice) : null,
        this.insights.vendorRevenueSeries(vendorId, slice, windows.unit),
        this.insights.vendorOrdersByStatus(vendorId, slice),
        this.insights.vendorTopProducts(vendorId, slice, TOP_LIMIT),
        this.insights.vendorTopCountries(vendorId, slice, TOP_LIMIT),
        this.insights.vendorCatalog(vendorId),
      ]);

    return {
      meta,
      vendor: { id: vendor.id, slug: vendor.slug, name: vendor.name, viewerRole },
      kpis: {
        ...totalsKpis(totals, previous),
        averageOrderMinor: pair(averageOrder(totals), previous && averageOrder(previous)),
        refundRate: pair(refundRate(totals), previous && refundRate(previous)),
      },
      revenueSeries: fillSeries(series, windows, { netMinor: 0, orders: 0 }),
      ordersByStatus: byStatus,
      topProducts,
      topCountries,
      catalog: { ...catalog, ratingAvg: vendor.ratingAvg, ratingCount: vendor.ratingCount },
    };
  }

  async productInsights(
    actor: Actor,
    productId: string,
    query: InsightsDetailQuery,
  ): Promise<ProductInsightsResponse> {
    const product = await this.products.findById(productId);
    const vendor = product && (await this.vendors.findById(product.vendorId));

    if (
      product === undefined ||
      vendor === undefined ||
      memberRoleOf(vendor, actor.userId) === undefined
    ) {
      throw new NotFoundError("Product not found");
    }

    const windows = resolveWindows(query.period, this.clock());
    const meta = await this.meta({ kind: "product", productId }, query.period, query.currency);
    const slice: Slice = { currency: meta.currency, window: windows.current };
    const previousSlice = windows.previous && { ...slice, window: windows.previous };

    const [totals, previous, sales, distribution, reviews] = await Promise.all([
      this.insights.productTotals(productId, slice),
      previousSlice ? this.insights.productTotals(productId, previousSlice) : null,
      this.insights.productSalesSeries(productId, slice, windows.unit),
      this.insights.productRatingDistribution(productId),
      this.insights.productReviewsSeries(productId, windows.current, windows.unit),
    ]);

    return {
      meta,
      product: {
        id: product.id,
        name: product.name,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        stock: product.stock,
        ratingAvg: product.ratingAvg,
        ratingCount: product.ratingCount,
      },
      kpis: totalsKpis(totals, previous),
      salesSeries: fillSeries(sales, windows, { netMinor: 0, units: 0 }),
      ratingDistribution: fillRatings(distribution),
      reviewsSeries: fillSeries(reviews, windows, { count: 0 }),
    };
  }

  private async meta(
    scope: InsightsScope,
    period: InsightPeriod,
    requested: Currency | undefined,
  ): Promise<Meta> {
    const usage = await this.insights.currencies(scope);
    const currencies = usage.map((entry) => entry.currency);
    const currency = requested ?? currencies[0] ?? FALLBACK_CURRENCY;

    return {
      period,
      currency,
      currencies: currencies.length > 0 ? currencies : [currency],
    };
  }
}

function pair(value: number, previous: number | null): Pair {
  return { value, previous };
}

function totalsKpis(totals: Totals, previous: Totals | null) {
  const net = (value: Totals) => value.grossMinor - value.refundedMinor;

  return {
    netMinor: pair(net(totals), previous && net(previous)),
    grossMinor: pair(totals.grossMinor, previous && previous.grossMinor),
    refundedMinor: pair(totals.refundedMinor, previous && previous.refundedMinor),
    orders: pair(totals.orders, previous && previous.orders),
    units: pair(totals.units, previous && previous.units),
  };
}

function averageOrder(totals: Totals): number {
  return totals.orders === 0 ? 0 : Math.round(totals.grossMinor / totals.orders);
}

function refundRate(totals: Totals): number {
  return totals.orders === 0 ? 0 : totals.refundedOrders / totals.orders;
}

function fillSeries<Point extends { bucket: string }>(
  points: Point[],
  windows: PeriodWindows,
  empty: Omit<Point, "bucket">,
): Point[] {
  const byBucket = new Map(points.map((point) => [point.bucket, point]));
  const from = windows.current.from ?? firstBucket(points.map((point) => point.bucket));

  if (from === null) {
    return [];
  }

  return bucketKeys(from, windows.current.to, windows.unit).map(
    (bucket) => byBucket.get(bucket) ?? ({ bucket, ...empty } as Point),
  );
}

function fillRatings(distribution: RatingBucket[]): RatingBucket[] {
  return RATINGS.map(
    (rating) => distribution.find((entry) => entry.rating === rating) ?? { rating, count: 0 },
  );
}
