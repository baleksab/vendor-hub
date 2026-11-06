import type { ProductSearchQuery } from "../../api/endpoints/products.server";

export const PRODUCT_PAGE_SIZE = 12;
export const MINOR_UNITS_PER_MAJOR = 100;
export const MIN_RATING_OPTIONS = [4, 3] as const;

export const PRODUCT_SORTS = [
  "relevance",
  "newest",
  "priceAsc",
  "priceDesc",
  "rating",
  "name",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export type ProductFilters = {
  q: string | null;
  category: string | null;
  minRating: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  sort: ProductSort | null;
  page: number;
};

const MAX_QUERY_LENGTH = 100;
const MAX_PRICE_MAJOR = 20_000_000;
const MAX_PAGE = 10_000;

function parseInteger(value: string | null, min: number, max: number): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return parsed >= min && parsed <= max ? parsed : null;
}

export function parseProductFilters(
  params: URLSearchParams,
  knownCategories: ReadonlySet<string>,
): ProductFilters {
  const q = params.get("q")?.trim() ?? "";
  const category = params.get("category");
  const sort = params.get("sort");
  const minRating = parseInteger(params.get("minRating"), 1, 5);

  return {
    q: q === "" ? null : q.slice(0, MAX_QUERY_LENGTH),
    category: category !== null && knownCategories.has(category) ? category : null,
    minRating,
    minPrice: parseInteger(params.get("minPrice"), 0, MAX_PRICE_MAJOR),
    maxPrice: parseInteger(params.get("maxPrice"), 0, MAX_PRICE_MAJOR),
    inStock: params.get("inStock") === "true",
    sort: PRODUCT_SORTS.find((candidate) => candidate === sort) ?? null,
    page: parseInteger(params.get("page"), 1, MAX_PAGE) ?? 1,
  };
}

export function toSharedApiQuery(filters: ProductFilters) {
  return {
    ...(filters.q === null ? {} : { q: filters.q }),
    ...(filters.minRating === null ? {} : { minRating: filters.minRating }),
    ...(filters.minPrice === null ? {} : { minPrice: filters.minPrice * MINOR_UNITS_PER_MAJOR }),
    ...(filters.maxPrice === null ? {} : { maxPrice: filters.maxPrice * MINOR_UNITS_PER_MAJOR }),
    ...(filters.inStock ? { inStock: "true" as const } : {}),
  };
}

export function toApiQuery(filters: ProductFilters): ProductSearchQuery {
  return {
    ...toSharedApiQuery(filters),
    ...(filters.category === null
      ? {}
      : { category: filters.category as ProductSearchQuery["category"] }),
    ...(filters.sort === null ? {} : { sort: filters.sort }),
    limit: PRODUCT_PAGE_SIZE,
    offset: (filters.page - 1) * PRODUCT_PAGE_SIZE,
  };
}

export function toSearchParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q !== null) params.set("q", filters.q);
  if (filters.category !== null) params.set("category", filters.category);
  if (filters.minRating !== null) params.set("minRating", String(filters.minRating));
  if (filters.minPrice !== null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.inStock) params.set("inStock", "true");
  if (filters.sort !== null) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}
