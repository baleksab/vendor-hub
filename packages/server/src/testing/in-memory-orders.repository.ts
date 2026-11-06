import type {
  CreateOrdersResult,
  NewOrders,
  Order,
  OrderChange,
  OrderListQuery,
  OrderSummary,
  StaleChange,
  StaleOrder,
  StaleOutcome,
  StaleQuery,
} from "../orders/order.ts";
import type { OrdersRepository } from "../orders/orders.repository.ts";
import type { Clock } from "../orders/orders.service.ts";
import type { InMemoryProductsRepository } from "./in-memory-products.repository.ts";
import type { InMemoryVendorsRepository } from "./in-memory-vendors.repository.ts";

type StoredOrder = Omit<Order, "vendorSlug" | "vendorName" | "itemCount" | "buyerName"> & {
  idempotencyKey: string;
};

export class InMemoryOrdersRepository implements OrdersRepository {
  readonly rows: StoredOrder[] = [];
  readonly failingIds = new Set<string>();
  private readonly products: InMemoryProductsRepository;
  private readonly vendors: InMemoryVendorsRepository;
  private readonly clock: Clock;

  constructor(
    products: InMemoryProductsRepository,
    vendors: InMemoryVendorsRepository,
    clock: Clock,
  ) {
    this.products = products;
    this.vendors = vendors;
    this.clock = clock;
  }

  async createOrders(input: NewOrders): Promise<CreateOrdersResult> {
    const duplicate = this.rows.some(
      (row) =>
        row.userId === input.userId &&
        row.idempotencyKey === input.idempotencyKey &&
        input.orders.some(
          (order) => order.vendorId === row.vendorId && order.currency === row.currency,
        ),
    );

    if (duplicate) {
      return { kind: "duplicate" };
    }

    const items = input.orders.flatMap((order) => order.items);
    const enough = items.every((item) => {
      const product = this.products.rows.find((row) => row.id === item.productId);

      return product !== undefined && product.stock >= item.quantity;
    });

    if (!enough) {
      return { kind: "outOfStock" };
    }

    for (const item of items) {
      this.adjustStock(item.productId, -item.quantity);
    }

    const now = this.clock();
    const orderIds = input.orders.map((order) => {
      const id = crypto.randomUUID();

      this.rows.push({
        id,
        userId: input.userId,
        vendorId: order.vendorId,
        status: "created",
        currency: order.currency,
        totalMinor: order.totalMinor,
        idempotencyKey: input.idempotencyKey,
        shipping: { ...input.shipping },
        items: order.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
        payments: [],
        events: [
          {
            id: crypto.randomUUID(),
            fromStatus: null,
            toStatus: "created",
            actor: "buyer",
            note: null,
            createdAt: now,
          },
        ],
        paymentAttempts: 0,
        createdAt: now,
        paidAt: null,
        deliveredAt: null,
        closedAt: null,
        cancelledAt: null,
      });

      return id;
    });

    return { kind: "created", orderIds };
  }

  async findIdsByIdempotencyKey(userId: string, idempotencyKey: string): Promise<string[]> {
    return this.rows
      .filter((row) => row.userId === userId && row.idempotencyKey === idempotencyKey)
      .map((row) => row.id);
  }

  async findById(id: string): Promise<Order | undefined> {
    const row = this.rows.find((candidate) => candidate.id === id);

    return row === undefined ? undefined : this.toOrder(row);
  }

  async listForBuyer(userId: string, query: OrderListQuery) {
    return this.list((row) => row.userId === userId, query);
  }

  async listForVendor(vendorId: string, query: OrderListQuery) {
    return this.list((row) => row.vendorId === vendorId, query);
  }

  async applyChange(change: OrderChange): Promise<boolean> {
    const row = this.rows.find((candidate) => candidate.id === change.orderId);

    if (row === undefined || row.status !== change.from) {
      return false;
    }

    if (this.failingIds.has(row.id)) {
      throw new Error(`Simulated failure for order ${row.id}`);
    }

    const now = this.clock();

    row.status = change.to;

    if (change.countPaymentAttempt) {
      row.paymentAttempts += 1;
    }

    if (change.timestamp !== null) {
      row[change.timestamp] = now;
    }

    if (change.payment !== null) {
      row.payments.push({ ...change.payment, id: crypto.randomUUID(), createdAt: now });
    }

    row.events.push({
      id: crypto.randomUUID(),
      fromStatus: change.from,
      toStatus: change.to,
      actor: change.actor,
      note: change.note,
      createdAt: now,
    });

    if (change.restoreStock) {
      for (const item of row.items) {
        this.adjustStock(item.productId, item.quantity);
      }
    }

    return true;
  }

  async applyToNextStale(
    query: StaleQuery,
    build: (order: StaleOrder) => StaleChange,
  ): Promise<StaleOutcome | null> {
    const column = query.status === "created" ? "createdAt" : "deliveredAt";
    const row = this.rows
      .filter((candidate) => {
        const since = candidate[column];

        return (
          candidate.status === query.status &&
          since !== null &&
          since < query.olderThan &&
          !query.exclude.includes(candidate.id)
        );
      })
      .sort((left, right) => (left[column]?.getTime() ?? 0) - (right[column]?.getTime() ?? 0))[0];

    if (row === undefined) {
      return null;
    }

    try {
      const change = build(row);
      const applied = await this.applyChange({ ...change, orderId: row.id, from: row.status });

      return { id: row.id, error: applied ? null : new Error("Order changed") };
    } catch (error) {
      return { id: row.id, error };
    }
  }

  private list(predicate: (row: StoredOrder) => boolean, query: OrderListQuery) {
    const matching = this.rows
      .filter(
        (row) => predicate(row) && (query.status === undefined || row.status === query.status),
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

    return {
      items: matching
        .slice(query.offset, query.offset + query.limit)
        .map((row): OrderSummary => this.toOrder(row)),
      total: matching.length,
    };
  }

  private adjustStock(productId: string, delta: number): void {
    const product = this.products.rows.find((row) => row.id === productId);

    if (product !== undefined) {
      product.stock += delta;
    }
  }

  private toOrder(row: StoredOrder): Order {
    const vendor = this.vendors.vendors.find((candidate) => candidate.id === row.vendorId);
    const { idempotencyKey: _key, ...order } = row;

    return {
      ...structuredClone(order),
      vendorSlug: vendor?.slug ?? "",
      vendorName: vendor?.name ?? "",
      itemCount: row.items.reduce((sum, item) => sum + item.quantity, 0),
      buyerName: `${row.shipping.firstName} ${row.shipping.lastName}`,
    };
  }
}
