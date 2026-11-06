export const PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;

export type SortField = "name" | "createdAt" | "memberCount";
export type SortOrder = "asc" | "desc";
export type Relation = "owned" | "operated";

export type Filters = {
  search: string;
  relation: Relation | null;
  sort: SortField;
  order: SortOrder;
  page: number;
  pageSize: number;
};

const RELATIONS: readonly Relation[] = ["owned", "operated"];
const SORT_FIELDS: readonly SortField[] = ["name", "createdAt", "memberCount"];
const ORDERS: readonly SortOrder[] = ["asc", "desc"];
const DEFAULT_SORT: SortField = "name";

export function defaultOrder(sort: SortField): SortOrder {
  return sort === "name" ? "asc" : "desc";
}

function readPositiveInteger(raw: string | null): number | null {
  const value = Number(raw);

  return raw !== null && Number.isInteger(value) && value >= 1 ? value : null;
}

export function readFilters(params: URLSearchParams): Filters {
  const relation = params.get("relation");
  const sort = SORT_FIELDS.find((candidate) => candidate === params.get("sort")) ?? DEFAULT_SORT;
  const pageSize = readPositiveInteger(params.get("size"));

  return {
    search: params.get("q") ?? "",
    relation: RELATIONS.find((candidate) => candidate === relation) ?? null,
    sort,
    order: ORDERS.find((candidate) => candidate === params.get("order")) ?? defaultOrder(sort),
    page: readPositiveInteger(params.get("page")) ?? 1,
    pageSize: PAGE_SIZES.find((candidate) => candidate === pageSize) ?? DEFAULT_PAGE_SIZE,
  };
}

export function writeFilters(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search !== "") {
    params.set("q", filters.search);
  }

  if (filters.relation !== null) {
    params.set("relation", filters.relation);
  }

  if (filters.sort !== DEFAULT_SORT) {
    params.set("sort", filters.sort);
  }

  if (filters.order !== defaultOrder(filters.sort)) {
    params.set("order", filters.order);
  }

  if (filters.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("size", String(filters.pageSize));
  }

  if (filters.page !== 1) {
    params.set("page", String(filters.page));
  }

  return params;
}

export function hasActiveFilters(filters: Filters): boolean {
  return filters.search !== "" || filters.relation !== null;
}

export function nextSort(filters: Filters, field: SortField): Pick<Filters, "sort" | "order"> {
  if (filters.sort === field) {
    return { sort: field, order: filters.order === "asc" ? "desc" : "asc" };
  }

  return { sort: field, order: defaultOrder(field) };
}
