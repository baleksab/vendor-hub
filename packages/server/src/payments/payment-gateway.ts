import type { Currency } from "../products/currencies.ts";
import type { PaymentFailureReason } from "./payment.ts";

export type ChargeRequest = {
  amountMinor: number;
  currency: Currency;
  cardNumber: string;
};

export type RefundRequest = {
  amountMinor: number;
  currency: Currency;
};

export type GatewayOutcome =
  | { status: "succeeded" }
  | { status: "failed"; reason: PaymentFailureReason };

export type PaymentGateway = {
  charge(request: ChargeRequest): Promise<GatewayOutcome>;
  refund(request: RefundRequest): Promise<GatewayOutcome>;
};
