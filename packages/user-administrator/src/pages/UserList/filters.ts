import type { UserResponse } from "@vendor-hub/types";

export const PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;

type Role = UserResponse["role"];

export type Filters = {
  search: string;
  role: Role | null;
  country: string | null;
  page: number;
  pageSize: number;
};

const ROLES: readonly Role[] = ["administrator", "regular"];

function readPositiveInteger(raw: string | null): number | null {
  const value = Number(raw);

  return raw !== null && Number.isInteger(value) && value >= 1 ? value : null;
}

export function readFilters(params: URLSearchParams): Filters {
  const role = params.get("role");
  const pageSize = readPositiveInteger(params.get("size"));

  return {
    search: params.get("q") ?? "",
    role: ROLES.find((candidate) => candidate === role) ?? null,
    country: params.get("country"),
    page: readPositiveInteger(params.get("page")) ?? 1,
    pageSize: PAGE_SIZES.find((candidate) => candidate === pageSize) ?? DEFAULT_PAGE_SIZE,
  };
}

export function writeFilters(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search !== "") {
    params.set("q", filters.search);
  }

  if (filters.role !== null) {
    params.set("role", filters.role);
  }

  if (filters.country !== null) {
    params.set("country", filters.country);
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
  return filters.search !== "" || filters.role !== null || filters.country !== null;
}
