import type { CartService, Quote, QuotedLine } from "../cart/cart.service.ts";
import type { PaymentGateway } from "../payments/payment-gateway.ts";
import type { PaymentFailureReason, PaymentStatus } from "../payments/payment.ts";
import { ConflictError, NotFoundError } from "../shared/errors.ts";
import { resolveAccess, type Actor } from "../vendors/vendor-access.ts";
import type { VendorsRepository } from "../vendors/vendors.repository.ts";
import type {
  NewOrder,
  OrderChange,
  OrderListQuery,
  OrderSummary,
  OrderTimestamps,
  StaleQuery,
} from "./order.ts";
import {
  isPaymentOpen,
  isReturnOpen,
  returnCutoff,
  transition,
  unpaidCutoff,
  type OrderAction,
} from "./order-state.ts";
import type { OrderActor } from "./order-status.ts";
import type { OrderRules, OrderView } from "./orders.mapper.ts";
import type { OrdersRepository } from "./orders.repository.ts";
import type { CreateOrdersRequest } from "./orders.schemas.ts";

export type OrdersConfig = OrderRules & { schedulerBatchSize: number };

export type Clock = () => Date;

export type CreatedOrders = { orders: OrderSummary[]; replayed: boolean };

export type PaymentResult = {
  view: OrderView;
  status: PaymentStatus;
  failureReason: PaymentFailureReason | null;
  attemptsLeft: number;
};

export type JobFailure = { orderId: string; error: unknown };

export type JobResult = { processed: number; failures: JobFailure[] };

type ActionOptions = {
  actor: OrderActor;
  actorUserId: string | null;
  note?: string | null;
  payment?: OrderChange["payment"];
  countPaymentAttempt?: boolean;
};

const TIMESTAMP_OF: Partial<Record<OrderAction, keyof OrderTimestamps>> = {
  pay: "paidAt",
  exhaustPayment: "cancelledAt",
  cancel: "cancelledAt",
  expire: "cancelledAt",
  deliver: "deliveredAt",
  confirmReceipt: "closedAt",
  autoClose: "closedAt",
};

const CART_CHANGED = "Some products in the cart changed, check the cart again";
const CHANGED_MEANWHILE = "The order changed in the meantime, reload it";

export class OrdersService {
  private readonly orders: OrdersRepository;
  private readonly vendors: VendorsRepository;
  private readonly cart: CartService;
  private readonly gateway: PaymentGateway;
  private readonly config: OrdersConfig;
  private readonly clock: Clock;

  constructor(
    orders: OrdersRepository,
    vendors: VendorsRepository,
    cart: CartService,
    gateway: PaymentGateway,
    config: OrdersConfig,
    clock: Clock,
  ) {
    this.orders = orders;
    this.vendors = vendors;
    this.cart = cart;
    this.gateway = gateway;
    this.config = config;
    this.clock = clock;
  }

  get rules(): OrderRules {
    return this.config;
  }

  now(): Date {
    return this.clock();
  }

  async create(actor: Actor, request: CreateOrdersRequest): Promise<CreatedOrders> {
    const existing = await this.replay(actor.userId, request.idempotencyKey);

    if (existing !== null) {
      return existing;
    }

    const quote = await this.cart.quote(request.lines);

    if (!quote.canCheckout) {
      throw cartConflict(quote);
    }

    const result = await this.orders.createOrders({
      userId: actor.userId,
      idempotencyKey: request.idempotencyKey,
      shipping: request.shipping,
      orders: splitByVendorAndCurrency(quote.lines),
    });

    switch (result.kind) {
      case "outOfStock":
        throw cartConflict(await this.cart.quote(request.lines));
      case "duplicate": {
        const replayed = await this.replay(actor.userId, request.idempotencyKey);

        if (replayed === null) {
          throw new ConflictError(CHANGED_MEANWHILE);
        }

        return replayed;
      }
      case "created":
        return { orders: await this.summaries(result.orderIds), replayed: false };
    }
  }

  listMine(actor: Actor, query: OrderListQuery): Promise<{ items: OrderSummary[]; total: number }> {
    return this.orders.listForBuyer(actor.userId, query);
  }

  async listForVendor(
    actor: Actor,
    vendorId: string,
    query: OrderListQuery,
  ): Promise<{ items: OrderSummary[]; total: number }> {
    if (!(await this.managesVendor(actor, vendorId))) {
      throw new NotFoundError("Vendor not found");
    }

    return this.orders.listForVendor(vendorId, query);
  }

  get(actor: Actor, id: string): Promise<OrderView> {
    return this.view(actor, id);
  }

  async pay(actor: Actor, id: string, cardNumber: string): Promise<PaymentResult> {
    const { order } = await this.asBuyer(actor, id);

    transition(order.status, "pay", "buyer");

    if (!isPaymentOpen(order, this.clock(), this.config)) {
      throw new ConflictError("The time to pay this order has run out");
    }

    const amount = { amountMinor: order.totalMinor, currency: order.currency };
    const outcome = await this.gateway.charge({ ...amount, cardNumber });

    if (outcome.status === "succeeded") {
      await this.act(id, order.status, "pay", {
        actor: "buyer",
        actorUserId: actor.userId,
        payment: { kind: "charge", status: "succeeded", failureReason: null, ...amount },
      });

      return this.paymentResult(actor, id, "succeeded", null);
    }

    const attempts = order.paymentAttempts + 1;
    const exhausted = attempts >= this.config.paymentMaxAttempts;
    const payment = {
      kind: "charge" as const,
      status: "failed" as const,
      failureReason: outcome.reason,
      ...amount,
    };

    await this.act(id, order.status, exhausted ? "exhaustPayment" : "failPayment", {
      actor: exhausted ? "system" : "buyer",
      actorUserId: exhausted ? null : actor.userId,
      note: outcome.reason,
      payment,
      countPaymentAttempt: true,
    });

    return this.paymentResult(actor, id, "failed", outcome.reason);
  }

  async cancel(actor: Actor, id: string): Promise<OrderView> {
    const { order } = await this.asBuyer(actor, id);

    await this.act(id, order.status, "cancel", { actor: "buyer", actorUserId: actor.userId });

    return this.view(actor, id);
  }

  async confirmReceipt(actor: Actor, id: string): Promise<OrderView> {
    const { order } = await this.asBuyer(actor, id);

    await this.act(id, order.status, "confirmReceipt", {
      actor: "buyer",
      actorUserId: actor.userId,
    });

    return this.view(actor, id);
  }

  async requestReturn(actor: Actor, id: string, reason: string): Promise<OrderView> {
    const { order } = await this.asBuyer(actor, id);

    transition(order.status, "requestReturn", "buyer", reason);

    if (!isReturnOpen(order, this.clock(), this.config)) {
      throw new ConflictError("The return window of this order has closed");
    }

    await this.act(id, order.status, "requestReturn", {
      actor: "buyer",
      actorUserId: actor.userId,
      note: reason,
    });

    return this.view(actor, id);
  }

  async deliver(actor: Actor, id: string): Promise<OrderView> {
    const { order } = await this.asVendor(actor, id);

    await this.act(id, order.status, "deliver", { actor: "vendor", actorUserId: actor.userId });

    return this.view(actor, id);
  }

  async approveReturn(actor: Actor, id: string): Promise<OrderView> {
    const { order } = await this.asVendor(actor, id);

    transition(order.status, "approveReturn", "vendor");

    const amount = { amountMinor: order.totalMinor, currency: order.currency };
    const refund = await this.gateway.refund(amount);

    if (refund.status === "failed") {
      throw new ConflictError("The refund failed, try again");
    }

    await this.act(id, order.status, "approveReturn", {
      actor: "vendor",
      actorUserId: actor.userId,
      payment: { kind: "refund", status: "succeeded", failureReason: null, ...amount },
    });

    return this.view(actor, id);
  }

  async rejectReturn(actor: Actor, id: string, reason: string): Promise<OrderView> {
    const { order } = await this.asVendor(actor, id);

    await this.act(id, order.status, "rejectReturn", {
      actor: "vendor",
      actorUserId: actor.userId,
      note: reason,
    });

    return this.view(actor, id);
  }

  expireUnpaid(): Promise<JobResult> {
    const olderThan = unpaidCutoff(this.clock(), this.config);

    return this.runJob({ status: "created", olderThan, exclude: [] }, "expire");
  }

  closeElapsed(): Promise<JobResult> {
    const olderThan = returnCutoff(this.clock(), this.config);

    return this.runJob({ status: "delivered", olderThan, exclude: [] }, "autoClose");
  }

  private async runJob(query: StaleQuery, action: "expire" | "autoClose"): Promise<JobResult> {
    const failures: JobFailure[] = [];
    let processed = 0;

    for (let index = 0; index < this.config.schedulerBatchSize; index += 1) {
      const outcome = await this.orders.applyToNextStale(
        { ...query, exclude: failures.map((failure) => failure.orderId) },
        (order) => {
          const result = transition(order.status, action, "system");

          return {
            to: result.to,
            actor: "system",
            actorUserId: null,
            note: null,
            restoreStock: result.restoresStock,
            payment: null,
            countPaymentAttempt: false,
            timestamp: TIMESTAMP_OF[action] ?? null,
          };
        },
      );

      if (outcome === null) {
        break;
      }

      if (outcome.error === null) {
        processed += 1;
      } else {
        failures.push({ orderId: outcome.id, error: outcome.error });
      }
    }

    return { processed, failures };
  }

  private async act(
    id: string,
    status: OrderChange["from"],
    action: OrderAction,
    options: ActionOptions,
  ): Promise<void> {
    const note = options.note ?? null;
    const result = transition(status, action, options.actor, note);

    const applied = await this.orders.applyChange({
      orderId: id,
      from: result.from,
      to: result.to,
      actor: options.actor,
      actorUserId: options.actorUserId,
      note,
      restoreStock: result.restoresStock,
      payment: options.payment ?? null,
      countPaymentAttempt: options.countPaymentAttempt ?? false,
      timestamp: TIMESTAMP_OF[action] ?? null,
    });

    if (!applied) {
      throw new ConflictError(CHANGED_MEANWHILE);
    }
  }

  private async paymentResult(
    actor: Actor,
    id: string,
    status: PaymentStatus,
    failureReason: PaymentFailureReason | null,
  ): Promise<PaymentResult> {
    const view = await this.view(actor, id);
    const attemptsLeft = Math.max(0, this.config.paymentMaxAttempts - view.order.paymentAttempts);

    return { view, status, failureReason, attemptsLeft };
  }

  private async replay(userId: string, idempotencyKey: string): Promise<CreatedOrders | null> {
    const ids = await this.orders.findIdsByIdempotencyKey(userId, idempotencyKey);

    return ids.length === 0 ? null : { orders: await this.summaries(ids), replayed: true };
  }

  private async summaries(ids: string[]): Promise<OrderSummary[]> {
    const orders = await Promise.all(ids.map((id) => this.orders.findById(id)));

    return orders.filter((order) => order !== undefined);
  }

  private async view(actor: Actor, id: string): Promise<OrderView> {
    const order = await this.orders.findById(id);

    if (order === undefined) {
      throw orderNotFound();
    }

    const buyer = order.userId === actor.userId;
    const vendor = await this.managesVendor(actor, order.vendorId);

    if (!buyer && !vendor) {
      throw orderNotFound();
    }

    return { order, viewer: { buyer, vendor } };
  }

  private async asBuyer(actor: Actor, id: string): Promise<OrderView> {
    const view = await this.view(actor, id);

    if (!view.viewer.buyer) {
      throw orderNotFound();
    }

    return view;
  }

  private async asVendor(actor: Actor, id: string): Promise<OrderView> {
    const view = await this.view(actor, id);

    if (!view.viewer.vendor) {
      throw orderNotFound();
    }

    return view;
  }

  private async managesVendor(actor: Actor, vendorId: string): Promise<boolean> {
    const vendor = await this.vendors.findById(vendorId);

    return vendor !== undefined && resolveAccess(actor, vendor) !== undefined;
  }
}

function orderNotFound(): NotFoundError {
  return new NotFoundError("Order not found");
}

function cartConflict(quote: Quote): ConflictError {
  return new ConflictError(CART_CHANGED, { quote });
}

export function splitByVendorAndCurrency(lines: QuotedLine[]): NewOrder[] {
  const groups = new Map<string, NewOrder>();

  for (const line of lines) {
    if (line.product === null || line.quantity === 0) {
      continue;
    }

    const { vendorId, currency } = line.product;
    const key = `${vendorId}:${currency}`;
    const group = groups.get(key) ?? { vendorId, currency, totalMinor: 0, items: [] };

    group.items.push({
      productId: line.productId,
      name: line.product.name,
      unitPriceMinor: line.product.priceMinor,
      quantity: line.quantity,
    });
    group.totalMinor += line.lineTotalMinor;
    groups.set(key, group);
  }

  return [...groups.values()];
}
