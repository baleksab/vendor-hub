import type { Order, OrderSummary } from "./order.ts";
import {
  allowedActions,
  paymentDeadline,
  returnDeadline,
  type OrderDeadlines,
} from "./order-state.ts";
import type { OrderResponse } from "./orders.schemas.ts";

export type OrderViewer = { buyer: boolean; vendor: boolean };

export type OrderView = { order: Order; viewer: OrderViewer };

export type OrderRules = OrderDeadlines & { paymentMaxAttempts: number };

const iso = (date: Date | null) => (date === null ? null : date.toISOString());

export function toOrderSummaryResponse(order: OrderSummary) {
  return {
    id: order.id,
    vendorId: order.vendorId,
    vendorSlug: order.vendorSlug,
    vendorName: order.vendorName,
    status: order.status,
    currency: order.currency,
    totalMinor: order.totalMinor,
    itemCount: order.itemCount,
    buyerName: order.buyerName,
    createdAt: order.createdAt.toISOString(),
  };
}

export function toOrderResponse(view: OrderView, now: Date, rules: OrderRules): OrderResponse {
  const { order, viewer } = view;

  return {
    ...toOrderSummaryResponse(order),
    shipping: order.shipping,
    items: order.items.map((item) => ({
      ...item,
      lineTotalMinor: item.unitPriceMinor * item.quantity,
    })),
    payments: order.payments.map((payment) => ({
      ...payment,
      createdAt: payment.createdAt.toISOString(),
    })),
    events: order.events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
    paymentAttempts: order.paymentAttempts,
    paymentAttemptsLeft: Math.max(0, rules.paymentMaxAttempts - order.paymentAttempts),
    paymentDeadline:
      order.status === "created" ? paymentDeadline(order.createdAt, rules).toISOString() : null,
    returnDeadline:
      order.status === "delivered" && order.deliveredAt !== null
        ? returnDeadline(order.deliveredAt, rules).toISOString()
        : null,
    paidAt: iso(order.paidAt),
    deliveredAt: iso(order.deliveredAt),
    closedAt: iso(order.closedAt),
    cancelledAt: iso(order.cancelledAt),
    viewer,
    allowedActions: allowedActions(order, viewer, now, rules),
  };
}
