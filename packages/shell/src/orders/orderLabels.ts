import type { OrderEventResponse, OrderResponse, OrderStatus } from "@vendor-hub/types";

import { orderEventKind } from "@vendor-hub/ui";

import type { T } from "../i18n";

export const ORDER_STATUSES = [
  "created",
  "paid",
  "delivered",
  "closed",
  "cancelled",
  "return_requested",
  "return_approved",
  "return_rejected",
] as const satisfies readonly OrderStatus[];

export function statusLabel(t: T, status: OrderStatus): string {
  return t(`order.status.${status}`);
}

export function eventTitle(t: T, event: OrderEventResponse): string {
  const kind = orderEventKind(event.fromStatus, event.toStatus);

  return kind === "statusChange" ? statusLabel(t, event.toStatus) : t(`order.event.${kind}`);
}

export function eventNote(t: T, event: OrderEventResponse): string | null {
  if (event.note === "declined" || event.note === "unknownCard") {
    return t(`order.failure.${event.note}`);
  }

  return event.note;
}

export function timelineEntries(t: T, order: OrderResponse) {
  return order.events.map((event) => ({
    id: event.id,
    title: eventTitle(t, event),
    actorLabel: t(`order.actor.${event.actor}`),
    note: eventNote(t, event),
    createdAt: event.createdAt,
  }));
}

export function paymentEntries(t: T, order: OrderResponse) {
  return order.payments.map((payment) => ({
    id: payment.id,
    label: t(`order.payment.${payment.kind}`),
    succeeded: payment.status === "succeeded",
    statusLabel: t(`order.payment.${payment.status}`),
    reason: payment.failureReason === null ? null : t(`order.failure.${payment.failureReason}`),
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    createdAt: payment.createdAt,
  }));
}
