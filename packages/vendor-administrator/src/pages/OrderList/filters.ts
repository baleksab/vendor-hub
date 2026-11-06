import type { OrderStatus } from "@vendor-hub/types";

import { ORDER_STATUSES } from "../../orderLabels";

export const ORDER_PAGE_SIZE = 20;

export type OrderFilters = { status: OrderStatus | null; page: number };

export function readFilters(params: URLSearchParams): OrderFilters {
  const status = ORDER_STATUSES.find((candidate) => candidate === params.get("status")) ?? null;
  const page = Number(params.get("page"));

  return { status, page: Number.isInteger(page) && page >= 1 ? page : 1 };
}

export function writeFilters(filters: OrderFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.status !== null) params.set("status", filters.status);
  if (filters.page !== 1) params.set("page", String(filters.page));

  return params;
}
