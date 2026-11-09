import { unwrap } from "@vendor-hub/api-client";
import type {
  InsightsDetailQuery,
  InsightsVendorListResponse,
  ProductInsightsResponse,
  VendorInsightsResponse,
} from "@vendor-hub/types";

import type { ApiClient } from "./client";
import type { VendorListParams } from "./queryKeys";

export function listInsightsVendors(
  client: ApiClient,
  params: VendorListParams,
): Promise<InsightsVendorListResponse> {
  return unwrap(client.GET("/api/v1/insights/vendors", { params: { query: params } }));
}

export function getVendorInsights(
  client: ApiClient,
  id: string,
  query: InsightsDetailQuery,
): Promise<VendorInsightsResponse> {
  return unwrap(client.GET("/api/v1/insights/vendors/{id}", { params: { path: { id }, query } }));
}

export function getProductInsights(
  client: ApiClient,
  id: string,
  query: InsightsDetailQuery,
): Promise<ProductInsightsResponse> {
  return unwrap(client.GET("/api/v1/insights/products/{id}", { params: { path: { id }, query } }));
}
