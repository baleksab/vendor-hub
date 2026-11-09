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
} from "../insights/insight.ts";
import type { InsightWindow } from "../insights/insights.period.ts";
import type { InMemoryVendorsRepository } from "./in-memory-vendors.repository.ts";

const EMPTY_TOTALS: Totals = {
  grossMinor: 0,
  refundedMinor: 0,
  orders: 0,
  refundedOrders: 0,
  units: 0,
};

export class InMemoryInsightsRepository implements InsightsRepository {
  usage: CurrencyUsage[] = [];
  totals: Totals = EMPTY_TOTALS;
  previousTotals: Totals = EMPTY_TOTALS;
  revenueSeries: RevenuePoint[] = [];
  salesSeries: SalesPoint[] = [];
  ratingDistribution: RatingBucket[] = [];
  readonly slices: Slice[] = [];
  readonly listQueries: InsightsVendorQuery[] = [];
  private readonly vendors: InMemoryVendorsRepository;

  constructor(vendors: InMemoryVendorsRepository) {
    this.vendors = vendors;
  }

  async currencies(_scope: InsightsScope): Promise<CurrencyUsage[]> {
    return this.usage;
  }

  async listVendors(
    query: InsightsVendorQuery,
  ): Promise<{ items: InsightsVendorRow[]; total: number }> {
    this.listQueries.push(query);

    const search = query.search?.toLowerCase();
    const rows = this.vendors.members
      .filter((member) => member.userId === query.userId)
      .filter(
        (member) =>
          query.relation === undefined ||
          member.role === (query.relation === "owned" ? "owner" : "operator"),
      )
      .flatMap((member) => {
        const vendor = this.vendors.vendors.find((candidate) => candidate.id === member.vendorId);

        return vendor === undefined ? [] : [{ vendor, role: member.role }];
      })
      .filter(
        ({ vendor }) =>
          search === undefined ||
          vendor.name.toLowerCase().includes(search) ||
          vendor.slug.toLowerCase().includes(search),
      )
      .sort((left, right) => left.vendor.name.localeCompare(right.vendor.name));

    const items = rows.slice(query.offset, query.offset + query.limit).map(({ vendor, role }) => ({
      id: vendor.id,
      slug: vendor.slug,
      name: vendor.name,
      viewerRole: role,
      productCount: 0,
      orderCount: 0,
      netMinor: 0,
      previousNetMinor: 0,
      ratingAvg: vendor.ratingAvg,
      ratingCount: vendor.ratingCount,
    }));

    return { items, total: rows.length };
  }

  async vendorTotals(_vendorId: string, slice: Slice): Promise<Totals> {
    return this.totalsFor(slice);
  }

  async vendorRevenueSeries(): Promise<RevenuePoint[]> {
    return this.revenueSeries;
  }

  async vendorOrdersByStatus(): Promise<StatusCount[]> {
    return [];
  }

  async vendorTopProducts(): Promise<TopProduct[]> {
    return [];
  }

  async vendorTopCountries(): Promise<TopCountry[]> {
    return [];
  }

  async vendorCatalog(): Promise<CatalogStats> {
    return { productCount: 0, outOfStockCount: 0 };
  }

  async productTotals(_productId: string, slice: Slice): Promise<Totals> {
    return this.totalsFor(slice);
  }

  async productSalesSeries(): Promise<SalesPoint[]> {
    return this.salesSeries;
  }

  async productRatingDistribution(): Promise<RatingBucket[]> {
    return this.ratingDistribution;
  }

  async productReviewsSeries(_productId: string, _window: InsightWindow): Promise<CountPoint[]> {
    return [];
  }

  private totalsFor(slice: Slice): Totals {
    this.slices.push(slice);

    return this.slices.length % 2 === 1 ? this.totals : this.previousTotals;
  }
}
