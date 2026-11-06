import type { Currency } from "../products/currencies.ts";
import type { PaymentFailureReason, PaymentKind, PaymentStatus } from "../payments/payment.ts";
import type { OrderActor, OrderStatus } from "./order-status.ts";

export type ShippingDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  country: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
};

export type Payment = {
  id: string;
  kind: PaymentKind;
  status: PaymentStatus;
  amountMinor: number;
  currency: Currency;
  failureReason: PaymentFailureReason | null;
  createdAt: Date;
};

export type OrderEvent = {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  actor: OrderActor;
  note: string | null;
  createdAt: Date;
};

export type OrderSummary = {
  id: string;
  userId: string;
  vendorId: string;
  vendorSlug: string;
  vendorName: string;
  status: OrderStatus;
  currency: Currency;
  totalMinor: number;
  itemCount: number;
  buyerName: string;
  createdAt: Date;
};

export type OrderTimestamps = {
  paidAt: Date | null;
  deliveredAt: Date | null;
  closedAt: Date | null;
  cancelledAt: Date | null;
};

export type Order = OrderSummary &
  OrderTimestamps & {
    paymentAttempts: number;
    shipping: ShippingDetails;
    items: OrderItem[];
    payments: Payment[];
    events: OrderEvent[];
  };

export type NewOrderItem = Omit<OrderItem, "id">;

export type NewOrder = {
  vendorId: string;
  currency: Currency;
  totalMinor: number;
  items: NewOrderItem[];
};

export type NewOrders = {
  userId: string;
  idempotencyKey: string;
  shipping: ShippingDetails;
  orders: NewOrder[];
};

export type CreateOrdersResult =
  | { kind: "created"; orderIds: string[] }
  | { kind: "outOfStock" }
  | { kind: "duplicate" };

export type NewPayment = Omit<Payment, "id" | "createdAt">;

export type OrderChange = {
  orderId: string;
  from: OrderStatus;
  to: OrderStatus;
  actor: OrderActor;
  actorUserId: string | null;
  note: string | null;
  restoreStock: boolean;
  payment: NewPayment | null;
  countPaymentAttempt: boolean;
  timestamp: keyof OrderTimestamps | null;
};

export type StaleOrder = {
  id: string;
  status: OrderStatus;
  currency: Currency;
  totalMinor: number;
};

export type StaleQuery = {
  status: "created" | "delivered";
  olderThan: Date;
  exclude: string[];
};

export type StaleChange = Omit<OrderChange, "orderId" | "from">;

export type StaleOutcome = { id: string; error: unknown };

export type OrderListQuery = {
  status?: OrderStatus | undefined;
  limit: number;
  offset: number;
};
