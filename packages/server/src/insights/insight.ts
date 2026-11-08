import type { OrderStatus } from "../orders/order-status.ts";
import type { Currency } from "../products/currencies.ts";
import type { VendorMemberRole } from "../vendors/vendor-member-role.ts";
import type { BucketUnit, InsightWindow } from "./insights.period.ts";

export type Totals = {
  grossMinor: number;
  refundedMinor: number;
  orders: number;
  refundedOrders: number;
  units: number;
};

export type RevenuePoint = { bucket: string; netMinor: number; orders: number };

export type SalesPoint = { bucket: string; netMinor: number; units: number };

export type CountPoint = { bucket: string; count: number };

export type StatusCount = { status: OrderStatus; count: number };

export type TopProduct = {
  productId: string;
  name: string;
  unitsSold: number;
  netMinor: number;
  ratingAvg: number | null;
  available: boolean;
};

export type TopCountry = { country: string; orders: number; netMinor: number };

export type CatalogStats = { productCount: number; outOfStockCount: number };

export type RatingBucket = { rating: number; count: number };

export type CurrencyUsage = { currency: Currency; orders: number };

export type InsightsScope =
  | { kind: "member"; userId: string }
  | { kind: "vendor"; vendorId: string }
  | { kind: "product"; productId: string };

export type InsightsVendorRow = {
  id: string;
  slug: string;
  name: string;
  viewerRole: VendorMemberRole;
  productCount: number;
  orderCount: number;
  netMinor: number;
  previousNetMinor: number;
  ratingAvg: number;
  ratingCount: number;
};

export const VENDOR_SORT_FIELDS = ["revenue", "orders", "products", "rating", "name"] as const;

export type VendorSortField = (typeof VENDOR_SORT_FIELDS)[number];

export type InsightsVendorQuery = {
  userId: string;
  search: string | undefined;
  relation: "owned" | "operated" | undefined;
  sort: VendorSortField;
  direction: "asc" | "desc";
  limit: number;
  offset: number;
  currency: Currency;
  current: InsightWindow;
  previous: InsightWindow | null;
};

export type Slice = { currency: Currency; window: InsightWindow };

export type InsightsRepository = {
  currencies(scope: InsightsScope): Promise<CurrencyUsage[]>;
  listVendors(query: InsightsVendorQuery): Promise<{ items: InsightsVendorRow[]; total: number }>;
  vendorTotals(vendorId: string, slice: Slice): Promise<Totals>;
  vendorRevenueSeries(vendorId: string, slice: Slice, unit: BucketUnit): Promise<RevenuePoint[]>;
  vendorOrdersByStatus(vendorId: string, slice: Slice): Promise<StatusCount[]>;
  vendorTopProducts(vendorId: string, slice: Slice, limit: number): Promise<TopProduct[]>;
  vendorTopCountries(vendorId: string, slice: Slice, limit: number): Promise<TopCountry[]>;
  vendorCatalog(vendorId: string): Promise<CatalogStats>;
  productTotals(productId: string, slice: Slice): Promise<Totals>;
  productSalesSeries(productId: string, slice: Slice, unit: BucketUnit): Promise<SalesPoint[]>;
  productRatingDistribution(productId: string): Promise<RatingBucket[]>;
  productReviewsSeries(
    productId: string,
    window: InsightWindow,
    unit: BucketUnit,
  ): Promise<CountPoint[]>;
};
