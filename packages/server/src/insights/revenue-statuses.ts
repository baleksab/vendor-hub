import type { OrderStatus } from "../orders/order-status.ts";

export const REFUNDED_STATUS = "return_approved" as const satisfies OrderStatus;

export const PAID_STATUSES = [
  "paid",
  "delivered",
  "closed",
  "return_requested",
  "return_rejected",
  REFUNDED_STATUS,
] as const satisfies readonly OrderStatus[];
