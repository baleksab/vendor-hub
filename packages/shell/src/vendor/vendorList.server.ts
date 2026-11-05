import { listVendors } from "../api/endpoints/vendors.server";
import { getEnv } from "../env.server";
import { vendorSiteOrigin } from "./vendorSite";

export const VENDORS_PAGE_SIZE = 12;

export type VendorCard = {
  slug: string;
  name: string;
  description: string;
  siteUrl: string;
};

export type VendorPage = {
  items: VendorCard[];
  page: number;
  pageCount: number;
};

export function readPage(request: Request): number {
  const raw = new URL(request.url).searchParams.get("page") ?? "";
  const page = /^\d+$/.test(raw) ? Number(raw) : 1;

  return page >= 1 ? page : 1;
}

export async function loadVendorPage(page: number): Promise<VendorPage> {
  const template = getEnv().vendorSiteOrigin;
  const { data, meta } = await listVendors({
    limit: VENDORS_PAGE_SIZE,
    offset: (page - 1) * VENDORS_PAGE_SIZE,
  });

  return {
    items: data.map((vendor) => ({
      ...vendor,
      siteUrl: vendorSiteOrigin(template, vendor.slug),
    })),
    page,
    pageCount: Math.max(1, Math.ceil(meta.total / VENDORS_PAGE_SIZE)),
  };
}
