export const PRODUCT_PAGE_SIZE = 20;

export type ProductSortField = "name" | "priceMinor" | "ratingAvg" | "createdAt";
export type SortOrder = "asc" | "desc";

export type ProductFilters = {
  search: string;
  category: string;
  inStock: boolean;
  sort: ProductSortField;
  order: SortOrder;
  page: number;
};

const SORT_FIELDS: readonly ProductSortField[] = ["name", "priceMinor", "ratingAvg", "createdAt"];
const ORDERS: readonly SortOrder[] = ["asc", "desc"];
const DEFAULT_SORT: ProductSortField = "createdAt";

export function defaultOrder(sort: ProductSortField): SortOrder {
  return sort === "name" || sort === "priceMinor" ? "asc" : "desc";
}

function readPositiveInteger(raw: string | null): number | null {
  const value = Number(raw);

  return raw !== null && Number.isInteger(value) && value >= 1 ? value : null;
}

export function readFilters(params: URLSearchParams): ProductFilters {
  const sort = SORT_FIELDS.find((candidate) => candidate === params.get("sort")) ?? DEFAULT_SORT;

  return {
    search: params.get("q") ?? "",
    category: params.get("category") ?? "",
    inStock: params.get("inStock") === "true",
    sort,
    order: ORDERS.find((candidate) => candidate === params.get("order")) ?? defaultOrder(sort),
    page: readPositiveInteger(params.get("page")) ?? 1,
  };
}

export function writeFilters(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search !== "") params.set("q", filters.search);
  if (filters.category !== "") params.set("category", filters.category);
  if (filters.inStock) params.set("inStock", "true");
  if (filters.sort !== DEFAULT_SORT) params.set("sort", filters.sort);
  if (filters.order !== defaultOrder(filters.sort)) params.set("order", filters.order);
  if (filters.page !== 1) params.set("page", String(filters.page));

  return params;
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return filters.search !== "" || filters.category !== "" || filters.inStock;
}

export function nextSort(
  filters: ProductFilters,
  field: ProductSortField,
): Pick<ProductFilters, "sort" | "order"> {
  if (filters.sort === field) {
    return { sort: field, order: filters.order === "asc" ? "desc" : "asc" };
  }

  return { sort: field, order: defaultOrder(field) };
}

export function toApiSort(filters: ProductFilters): string {
  switch (filters.sort) {
    case "name":
      return "name";
    case "priceMinor":
      return filters.order === "asc" ? "priceAsc" : "priceDesc";
    case "ratingAvg":
      return "rating";
    case "createdAt":
      return "newest";
  }
}
