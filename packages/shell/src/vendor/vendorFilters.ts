import type { VendorListQuery } from "../api/endpoints/vendors.server";

export const VENDORS_PAGE_SIZE = 12;
export const VENDOR_MIN_RATING_OPTIONS = [4, 3] as const;
export const VENDOR_SORTS = ["newest", "name", "rating", "productCount"] as const;

export type VendorSort = (typeof VENDOR_SORTS)[number];

export type VendorFilters = {
  q: string | null;
  category: string | null;
  minRating: number | null;
  sort: VendorSort | null;
  page: number;
};

const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 10_000;

function parseInteger(value: string | null, min: number, max: number): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return parsed >= min && parsed <= max ? parsed : null;
}

export function parseVendorFilters(
  params: URLSearchParams,
  knownCategories: ReadonlySet<string>,
): VendorFilters {
  const q = params.get("q")?.trim() ?? "";
  const category = params.get("category");
  const sort = params.get("sort");

  return {
    q: q === "" ? null : q.slice(0, MAX_QUERY_LENGTH),
    category: category !== null && knownCategories.has(category) ? category : null,
    minRating: parseInteger(params.get("minRating"), 1, 5),
    sort: VENDOR_SORTS.find((candidate) => candidate === sort) ?? null,
    page: parseInteger(params.get("page"), 1, MAX_PAGE) ?? 1,
  };
}

export function toVendorApiQuery(filters: VendorFilters): VendorListQuery {
  return {
    ...(filters.q === null ? {} : { search: filters.q }),
    ...(filters.category === null
      ? {}
      : { category: filters.category as VendorListQuery["category"] }),
    ...(filters.minRating === null ? {} : { minRating: filters.minRating }),
    ...(filters.sort === null ? {} : { sort: filters.sort }),
    limit: VENDORS_PAGE_SIZE,
    offset: (filters.page - 1) * VENDORS_PAGE_SIZE,
  };
}

export function toVendorSearchParams(filters: VendorFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q !== null) params.set("q", filters.q);
  if (filters.category !== null) params.set("category", filters.category);
  if (filters.minRating !== null) params.set("minRating", String(filters.minRating));
  if (filters.sort !== null) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}
