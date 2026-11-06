import { z } from "zod";

import { CartLineRequest, CartQuoteResponse } from "../cart/cart.schemas.ts";
import { PAYMENT_FAILURE_REASONS, PAYMENT_KINDS, PAYMENT_STATUSES } from "../payments/payment.ts";
import { CURRENCIES } from "../products/currencies.ts";
import { PageMeta, PaginationQuery } from "../shared/pagination.ts";
import { ProblemResponse } from "../shared/problem.ts";
import {
  address,
  country,
  email,
  firstName,
  lastName,
  phoneNumber,
} from "../users/users.schemas.ts";
import { USER_ORDER_ACTIONS } from "./order-state.ts";
import { ORDER_ACTORS, ORDER_STATUSES } from "./order-status.ts";

const REASON_MAX_LENGTH = 1000;
const CARD_NUMBER_PATTERN = /^\d{12,19}$/;
const WHITESPACE = /\s+/g;

const reason = z.string().trim().min(1).max(REASON_MAX_LENGTH);
const timestamp = z.iso.datetime();

export const OrderStatusSchema = z.enum(ORDER_STATUSES);

export const ShippingDetailsSchema = z
  .object({ firstName, lastName, email, phoneNumber, address, country })
  .meta({ id: "ShippingDetails" });

export const ShippingDetailsResponse = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phoneNumber: z.string(),
    address: z.string(),
    country: z.string(),
  })
  .meta({ id: "ShippingDetailsResponse" });

export const CreateOrdersRequest = z
  .object({
    lines: z.array(CartLineRequest).min(1),
    shipping: ShippingDetailsSchema,
    idempotencyKey: z.uuid(),
  })
  .meta({ id: "CreateOrdersRequest" });

export const PayOrderRequest = z
  .object({
    cardNumber: z
      .string()
      .transform((value) => value.replace(WHITESPACE, ""))
      .pipe(z.string().regex(CARD_NUMBER_PATTERN)),
  })
  .meta({ id: "PayOrderRequest" });

export const OrderReasonRequest = z.object({ reason }).meta({ id: "OrderReasonRequest" });

export const OrderListQuery = PaginationQuery.extend({ status: OrderStatusSchema.optional() });

export const OrderIdParams = z.object({ id: z.uuid() });

export const VendorOrdersParams = z.object({ id: z.uuid() });

export const OrderSummaryResponse = z
  .object({
    id: z.uuid(),
    vendorId: z.uuid(),
    vendorSlug: z.string(),
    vendorName: z.string(),
    status: OrderStatusSchema,
    currency: z.enum(CURRENCIES),
    totalMinor: z.number().int(),
    itemCount: z.number().int(),
    buyerName: z.string(),
    createdAt: timestamp,
  })
  .meta({ id: "OrderSummaryResponse" });

export const OrderListResponse = z
  .object({ data: z.array(OrderSummaryResponse), meta: PageMeta })
  .meta({ id: "OrderListResponse" });

export const CreateOrdersResponse = z
  .object({ data: z.array(OrderSummaryResponse) })
  .meta({ id: "CreateOrdersResponse" });

export const OrderItemResponse = z
  .object({
    id: z.uuid(),
    productId: z.uuid(),
    name: z.string(),
    unitPriceMinor: z.number().int(),
    quantity: z.number().int(),
    lineTotalMinor: z.number().int(),
  })
  .meta({ id: "OrderItemResponse" });

export const PaymentResponse = z
  .object({
    id: z.uuid(),
    kind: z.enum(PAYMENT_KINDS),
    status: z.enum(PAYMENT_STATUSES),
    amountMinor: z.number().int(),
    currency: z.enum(CURRENCIES),
    failureReason: z.enum(PAYMENT_FAILURE_REASONS).nullable(),
    createdAt: timestamp,
  })
  .meta({ id: "PaymentResponse" });

export const OrderEventResponse = z
  .object({
    id: z.uuid(),
    fromStatus: OrderStatusSchema.nullable(),
    toStatus: OrderStatusSchema,
    actor: z.enum(ORDER_ACTORS),
    note: z.string().nullable(),
    createdAt: timestamp,
  })
  .meta({ id: "OrderEventResponse" });

export const OrderResponse = z
  .object({
    ...OrderSummaryResponse.shape,
    shipping: ShippingDetailsResponse,
    items: z.array(OrderItemResponse),
    payments: z.array(PaymentResponse),
    events: z.array(OrderEventResponse),
    paymentAttempts: z.number().int(),
    paymentAttemptsLeft: z.number().int().min(0),
    paymentDeadline: timestamp.nullable(),
    returnDeadline: timestamp.nullable(),
    paidAt: timestamp.nullable(),
    deliveredAt: timestamp.nullable(),
    closedAt: timestamp.nullable(),
    cancelledAt: timestamp.nullable(),
    viewer: z.object({ buyer: z.boolean(), vendor: z.boolean() }),
    allowedActions: z.array(z.enum(USER_ORDER_ACTIONS)),
  })
  .meta({ id: "OrderResponse" });

export const PaymentOutcomeResponse = z
  .object({
    order: OrderResponse,
    payment: z.object({
      status: z.enum(PAYMENT_STATUSES),
      failureReason: z.enum(PAYMENT_FAILURE_REASONS).nullable(),
      attemptsLeft: z.number().int().min(0),
    }),
  })
  .meta({ id: "PaymentOutcomeResponse" });

export const CartConflictProblem = ProblemResponse.extend({ quote: CartQuoteResponse }).meta({
  id: "CartConflictProblem",
});

export type CreateOrdersRequest = z.infer<typeof CreateOrdersRequest>;
export type OrderListQuery = z.infer<typeof OrderListQuery>;
export type OrderResponse = z.infer<typeof OrderResponse>;
