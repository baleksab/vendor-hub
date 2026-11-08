import type { MyVendorsResponse } from "@vendor-hub/types";

export const INSIGHTS_PATH = "/insights/vendors";

export const insightsVendorPath = (id: string) => `${INSIGHTS_PATH}/${id}`;

export const insightsProductPath = (vendorId: string, productId: string) =>
  `${insightsVendorPath(vendorId)}/products/${productId}`;

export function hasInsights(
  vendors: Pick<MyVendorsResponse, "owned" | "operating"> | null,
): boolean {
  return vendors !== null && (vendors.owned !== null || vendors.operating.length > 0);
}
