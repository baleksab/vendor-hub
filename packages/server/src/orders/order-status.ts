export const ORDER_STATUSES = [
  "created",
  "paid",
  "delivered",
  "closed",
  "cancelled",
  "return_requested",
  "return_approved",
  "return_rejected",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_ACTORS = ["buyer", "vendor", "system"] as const;

export type OrderActor = (typeof ORDER_ACTORS)[number];
