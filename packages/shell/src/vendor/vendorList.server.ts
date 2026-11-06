import type { VendorListItemResponse } from "@vendor-hub/types";

import { listVendors } from "../api/endpoints/vendors.server";
import { toVendorApiQuery, VENDORS_PAGE_SIZE, type VendorFilters } from "./vendorFilters";

export type VendorPage = {
  items: VendorListItemResponse[];
  total: number;
  page: number;
  pageCount: number;
};

export async function loadVendorPage(filters: VendorFilters): Promise<VendorPage> {
  const { data, meta } = await listVendors(toVendorApiQuery(filters));

  return {
    items: data,
    total: meta.total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(meta.total / VENDORS_PAGE_SIZE)),
  };
}
