import { listVendors } from "../api/endpoints/vendors.server";

export const VENDORS_PAGE_SIZE = 12;

export type VendorCard = {
  slug: string;
  name: string;
  description: string;
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
  const { data, meta } = await listVendors({
    limit: VENDORS_PAGE_SIZE,
    offset: (page - 1) * VENDORS_PAGE_SIZE,
  });

  return {
    items: data,
    page,
    pageCount: Math.max(1, Math.ceil(meta.total / VENDORS_PAGE_SIZE)),
  };
}
