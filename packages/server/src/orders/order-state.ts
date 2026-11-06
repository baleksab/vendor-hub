import { ConflictError } from "../shared/errors.ts";
import type { OrderActor, OrderStatus } from "./order-status.ts";

export const ORDER_ACTIONS = [
  "pay",
  "failPayment",
  "exhaustPayment",
  "cancel",
  "expire",
  "deliver",
  "confirmReceipt",
  "autoClose",
  "requestReturn",
  "approveReturn",
  "rejectReturn",
] as const;

export type OrderAction = (typeof ORDER_ACTIONS)[number];

export const USER_ORDER_ACTIONS = [
  "pay",
  "cancel",
  "confirmReceipt",
  "requestReturn",
  "deliver",
  "approveReturn",
  "rejectReturn",
] as const satisfies readonly OrderAction[];

export type UserOrderAction = (typeof USER_ORDER_ACTIONS)[number];

type Transition = {
  from: OrderStatus;
  to: OrderStatus;
  actor: OrderActor;
  noteRequired: boolean;
};

const TRANSITIONS: Record<OrderAction, Transition> = {
  pay: { from: "created", to: "paid", actor: "buyer", noteRequired: false },
  failPayment: { from: "created", to: "created", actor: "buyer", noteRequired: false },
  exhaustPayment: { from: "created", to: "cancelled", actor: "system", noteRequired: false },
  cancel: { from: "created", to: "cancelled", actor: "buyer", noteRequired: false },
  expire: { from: "created", to: "cancelled", actor: "system", noteRequired: false },
  deliver: { from: "paid", to: "delivered", actor: "vendor", noteRequired: false },
  confirmReceipt: { from: "delivered", to: "closed", actor: "buyer", noteRequired: false },
  autoClose: { from: "delivered", to: "closed", actor: "system", noteRequired: false },
  requestReturn: {
    from: "delivered",
    to: "return_requested",
    actor: "buyer",
    noteRequired: true,
  },
  approveReturn: {
    from: "return_requested",
    to: "return_approved",
    actor: "vendor",
    noteRequired: false,
  },
  rejectReturn: {
    from: "return_requested",
    to: "return_rejected",
    actor: "vendor",
    noteRequired: true,
  },
};

const RESTORES_STOCK: ReadonlySet<OrderAction> = new Set([
  "exhaustPayment",
  "cancel",
  "expire",
  "approveReturn",
]);

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

export type OrderDeadlines = {
  paymentTtlMinutes: number;
  returnWindowDays: number;
};

export type DeadlineFacts = {
  status: OrderStatus;
  createdAt: Date;
  deliveredAt: Date | null;
};

export type TransitionResult = {
  from: OrderStatus;
  to: OrderStatus;
  restoresStock: boolean;
};

export function transition(
  status: OrderStatus,
  action: OrderAction,
  actor: OrderActor,
  note: string | null = null,
): TransitionResult {
  const rule = TRANSITIONS[action];

  if (rule.actor !== actor) {
    throw new ConflictError(`The ${actor} cannot ${action} an order`);
  }

  if (rule.from !== status) {
    throw new ConflictError(`An order in status ${status} cannot ${action}`);
  }

  if (rule.noteRequired && (note === null || note.trim() === "")) {
    throw new ConflictError(`${action} needs a reason`);
  }

  return { from: rule.from, to: rule.to, restoresStock: RESTORES_STOCK.has(action) };
}

export function paymentDeadline(createdAt: Date, deadlines: OrderDeadlines): Date {
  return new Date(createdAt.getTime() + deadlines.paymentTtlMinutes * MS_PER_MINUTE);
}

export function returnDeadline(deliveredAt: Date, deadlines: OrderDeadlines): Date {
  return new Date(deliveredAt.getTime() + deadlines.returnWindowDays * MS_PER_DAY);
}

export function unpaidCutoff(now: Date, deadlines: OrderDeadlines): Date {
  return new Date(now.getTime() - deadlines.paymentTtlMinutes * MS_PER_MINUTE);
}

export function returnCutoff(now: Date, deadlines: OrderDeadlines): Date {
  return new Date(now.getTime() - deadlines.returnWindowDays * MS_PER_DAY);
}

export function isPaymentOpen(order: DeadlineFacts, now: Date, deadlines: OrderDeadlines): boolean {
  return order.status === "created" && now < paymentDeadline(order.createdAt, deadlines);
}

export function isReturnOpen(order: DeadlineFacts, now: Date, deadlines: OrderDeadlines): boolean {
  return (
    order.status === "delivered" &&
    order.deliveredAt !== null &&
    now < returnDeadline(order.deliveredAt, deadlines)
  );
}

export function allowedActions(
  order: DeadlineFacts,
  viewer: { buyer: boolean; vendor: boolean },
  now: Date,
  deadlines: OrderDeadlines,
): UserOrderAction[] {
  return USER_ORDER_ACTIONS.filter((action) => {
    const rule = TRANSITIONS[action];
    const actorMatches = rule.actor === "buyer" ? viewer.buyer : viewer.vendor;

    if (!actorMatches || rule.from !== order.status) {
      return false;
    }

    if (action === "pay") {
      return isPaymentOpen(order, now, deadlines);
    }

    if (action === "requestReturn") {
      return isReturnOpen(order, now, deadlines);
    }

    return true;
  });
}
