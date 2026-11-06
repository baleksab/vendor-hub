import type { OrderResponse, OrderStatus } from "@vendor-hub/types";
import { orderEventKind } from "@vendor-hub/ui";

import type { MessageKey, T } from "./i18n/messages";

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
  return t(`order.status.${status}` satisfies MessageKey);
}

function failureLabel(t: T, reason: string | null): string | null {
  return reason === "declined" || reason === "unknownCard" ? t(`order.failure.${reason}`) : reason;
}

export function timelineEntries(t: T, order: OrderResponse) {
  return order.events.map((event) => {
    const kind = orderEventKind(event.fromStatus, event.toStatus);

    return {
      id: event.id,
      title: kind === "statusChange" ? statusLabel(t, event.toStatus) : t(`order.event.${kind}`),
      actorLabel: t(`order.actor.${event.actor}`),
      note: failureLabel(t, event.note),
      createdAt: event.createdAt,
    };
  });
}

export function paymentEntries(t: T, order: OrderResponse) {
  return order.payments.map((payment) => ({
    id: payment.id,
    label: t(`order.payment.${payment.kind}`),
    succeeded: payment.status === "succeeded",
    statusLabel: t(`order.payment.${payment.status}`),
    reason: failureLabel(t, payment.failureReason),
    amountMinor: payment.amountMinor,
    currency: payment.currency,
    createdAt: payment.createdAt,
  }));
}
