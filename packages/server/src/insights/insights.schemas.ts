import { z } from "zod";

import { ORDER_STATUSES } from "../orders/order-status.ts";
import { CURRENCIES } from "../products/currencies.ts";
import { PageMeta, PaginationQuery } from "../shared/pagination.ts";
import { VendorMemberRoleSchema } from "../vendors/vendor-member-role.ts";
import { VENDOR_SORT_FIELDS } from "./insight.ts";
import { InsightPeriodSchema } from "./insights.period.ts";

const SEARCH_MAX_LENGTH = 100;
const DEFAULT_PERIOD = "30d";

const CurrencySchema = z.enum(CURRENCIES);
const money = z.number().int();
const count = z.number().int().min(0);
const bucket = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const InsightsVendorListQuery = PaginationQuery.extend({
  search: z.string().trim().min(1).max(SEARCH_MAX_LENGTH).optional(),
  relation: z.enum(["owned", "operated"]).optional(),
  period: InsightPeriodSchema.default(DEFAULT_PERIOD),
  currency: CurrencySchema.optional(),
  sort: z.enum(VENDOR_SORT_FIELDS).default("revenue"),
  order: z.enum(["asc", "desc"]).optional(),
});

export const InsightsDetailQuery = z.object({
  period: InsightPeriodSchema.default(DEFAULT_PERIOD),
  currency: CurrencySchema.optional(),
});

export const InsightsVendorParams = z.object({ id: z.uuid() });

export const InsightsProductParams = z.object({ id: z.uuid() });

const Kpi = z.object({ value: money, previous: money.nullable() });

const InsightsMeta = z.object({
  period: InsightPeriodSchema,
  currency: CurrencySchema,
  currencies: z.array(CurrencySchema),
});

export const InsightsVendorRowResponse = z
  .object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    viewerRole: VendorMemberRoleSchema,
    productCount: count,
    orderCount: count,
    netMinor: money,
    previousNetMinor: money.nullable(),
    ratingAvg: z.number(),
    ratingCount: count,
  })
  .meta({ id: "InsightsVendorRow" });

export const InsightsVendorListResponse = z
  .object({
    data: z.array(InsightsVendorRowResponse),
    meta: PageMeta.extend(InsightsMeta.shape),
  })
  .meta({ id: "InsightsVendorListResponse" });

export const VendorInsightsResponse = z
  .object({
    meta: InsightsMeta,
    vendor: z.object({
      id: z.uuid(),
      slug: z.string(),
      name: z.string(),
      viewerRole: VendorMemberRoleSchema,
    }),
    kpis: z.object({
      netMinor: Kpi,
      grossMinor: Kpi,
      refundedMinor: Kpi,
      orders: Kpi,
      units: Kpi,
      averageOrderMinor: Kpi,
      refundRate: z.object({ value: z.number(), previous: z.number().nullable() }),
    }),
    revenueSeries: z.array(z.object({ bucket, netMinor: money, orders: count })),
    ordersByStatus: z.array(z.object({ status: z.enum(ORDER_STATUSES), count })),
    topProducts: z.array(
      z.object({
        productId: z.uuid(),
        name: z.string(),
        unitsSold: count,
        netMinor: money,
        ratingAvg: z.number().nullable(),
        available: z.boolean(),
      }),
    ),
    topCountries: z.array(z.object({ country: z.string(), orders: count, netMinor: money })),
    catalog: z.object({
      productCount: count,
      outOfStockCount: count,
      ratingAvg: z.number(),
      ratingCount: count,
    }),
  })
  .meta({ id: "VendorInsightsResponse" });

export const ProductInsightsResponse = z
  .object({
    meta: InsightsMeta,
    product: z.object({
      id: z.uuid(),
      name: z.string(),
      vendorId: z.uuid(),
      vendorName: z.string(),
      stock: count,
      ratingAvg: z.number(),
      ratingCount: count,
    }),
    kpis: z.object({
      netMinor: Kpi,
      grossMinor: Kpi,
      refundedMinor: Kpi,
      orders: Kpi,
      units: Kpi,
    }),
    salesSeries: z.array(z.object({ bucket, netMinor: money, units: count })),
    ratingDistribution: z.array(z.object({ rating: z.number().int().min(1).max(5), count })),
    reviewsSeries: z.array(z.object({ bucket, count })),
  })
  .meta({ id: "ProductInsightsResponse" });

export type InsightsVendorListQuery = z.infer<typeof InsightsVendorListQuery>;
export type InsightsDetailQuery = z.infer<typeof InsightsDetailQuery>;
export type VendorInsightsResponse = z.infer<typeof VendorInsightsResponse>;
export type ProductInsightsResponse = z.infer<typeof ProductInsightsResponse>;
export type InsightsVendorListResponse = z.infer<typeof InsightsVendorListResponse>;

export function resolveDirection(query: InsightsVendorListQuery): "asc" | "desc" {
  return query.order ?? (query.sort === "name" ? "asc" : "desc");
}
