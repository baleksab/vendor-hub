import type { InsightsDetailQuery, InsightsVendorListQuery } from "@vendor-hub/types";

export type VendorListParams = Required<Pick<InsightsVendorListQuery, "limit" | "offset">> &
  Omit<InsightsVendorListQuery, "limit" | "offset">;

export const insightsKeys = {
  all: ["insights"] as const,
  lists: () => [...insightsKeys.all, "list"] as const,
  list: (params: VendorListParams) => [...insightsKeys.lists(), params] as const,
  vendor: (id: string, query: InsightsDetailQuery) =>
    [...insightsKeys.all, "vendor", id, query] as const,
  product: (id: string, query: InsightsDetailQuery) =>
    [...insightsKeys.all, "product", id, query] as const,
};
