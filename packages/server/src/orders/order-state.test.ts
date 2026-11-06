import { describe, expect, it } from "vitest";

import {
  allowedActions,
  isPaymentOpen,
  isReturnOpen,
  ORDER_ACTIONS,
  transition,
  type OrderAction,
} from "./order-state.ts";
import { ORDER_ACTORS, ORDER_STATUSES, type OrderActor, type OrderStatus } from "./order-status.ts";

const deadlines = { paymentTtlMinutes: 30, returnWindowDays: 14 };
const created = new Date("2026-01-01T12:00:00Z");
const minutes = (count: number) => new Date(created.getTime() + count * 60_000);
const days = (count: number) => minutes(count * 24 * 60);

const LEGAL: [OrderAction, OrderStatus, OrderActor, OrderStatus][] = [
  ["pay", "created", "buyer", "paid"],
  ["failPayment", "created", "buyer", "created"],
  ["exhaustPayment", "created", "system", "cancelled"],
  ["cancel", "created", "buyer", "cancelled"],
  ["expire", "created", "system", "cancelled"],
  ["deliver", "paid", "vendor", "delivered"],
  ["confirmReceipt", "delivered", "buyer", "closed"],
  ["autoClose", "delivered", "system", "closed"],
  ["requestReturn", "delivered", "buyer", "return_requested"],
  ["approveReturn", "return_requested", "vendor", "return_approved"],
  ["rejectReturn", "return_requested", "vendor", "return_rejected"],
];

describe("order state machine", () => {
  it.each(LEGAL)("%s moves %s to %s for the %s", (action, from, actor, to) => {
    expect(transition(from, action, actor, "a reason").to).toBe(to);
  });

  it("rejects every other status for each action", () => {
    for (const [action, from, actor] of LEGAL) {
      for (const status of ORDER_STATUSES.filter((candidate) => candidate !== from)) {
        expect(() => transition(status, action, actor, "a reason")).toThrow(/cannot/);
      }
    }
  });

  it("rejects every other actor for each action", () => {
    for (const [action, from, actor] of LEGAL) {
      for (const other of ORDER_ACTORS.filter((candidate) => candidate !== actor)) {
        expect(() => transition(from, action, other, "a reason")).toThrow(/cannot/);
      }
    }
  });

  it("covers every action", () => {
    expect(LEGAL.map(([action]) => action).sort()).toEqual([...ORDER_ACTIONS].sort());
  });

  it.each(["requestReturn", "rejectReturn"] as const)("%s needs a reason", (action) => {
    const [, from, actor] = LEGAL.find(([candidate]) => candidate === action)!;

    expect(() => transition(from, action, actor, null)).toThrow(/reason/);
    expect(() => transition(from, action, actor, "   ")).toThrow(/reason/);
  });

  it("restores stock on cancellation and approved returns only", () => {
    const restoring = LEGAL.filter(
      ([action, from, actor]) => transition(from, action, actor, "r").restoresStock,
    ).map(([action]) => action);

    expect(restoring.sort()).toEqual(["approveReturn", "cancel", "exhaustPayment", "expire"]);
  });

  it("keeps the final statuses final", () => {
    for (const status of ["closed", "cancelled", "return_approved", "return_rejected"] as const) {
      expect(
        allowedActions(
          { status, createdAt: created, deliveredAt: created },
          { buyer: true, vendor: true },
          created,
          deadlines,
        ),
      ).toEqual([]);
    }
  });
});

describe("deadlines", () => {
  const unpaid = { status: "created" as const, createdAt: created, deliveredAt: null };
  const delivered = { status: "delivered" as const, createdAt: created, deliveredAt: created };

  it("keeps payment open until the TTL ends", () => {
    expect(isPaymentOpen(unpaid, minutes(29), deadlines)).toBe(true);
    expect(isPaymentOpen(unpaid, minutes(30), deadlines)).toBe(false);
  });

  it("keeps the return window open until it ends", () => {
    expect(isReturnOpen(delivered, days(13), deadlines)).toBe(true);
    expect(isReturnOpen(delivered, days(14), deadlines)).toBe(false);
  });

  it("offers each side only its own actions", () => {
    expect(allowedActions(unpaid, { buyer: true, vendor: false }, created, deadlines)).toEqual([
      "pay",
      "cancel",
    ]);
    expect(allowedActions(unpaid, { buyer: false, vendor: true }, created, deadlines)).toEqual([]);
    expect(allowedActions(delivered, { buyer: true, vendor: false }, days(1), deadlines)).toEqual([
      "confirmReceipt",
      "requestReturn",
    ]);
  });

  it("stops offering pay and return after the deadline", () => {
    expect(allowedActions(unpaid, { buyer: true, vendor: false }, minutes(31), deadlines)).toEqual([
      "cancel",
    ]);
    expect(allowedActions(delivered, { buyer: true, vendor: false }, days(15), deadlines)).toEqual([
      "confirmReceipt",
    ]);
  });
});
