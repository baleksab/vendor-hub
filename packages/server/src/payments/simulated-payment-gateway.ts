import type {
  ChargeRequest,
  GatewayOutcome,
  PaymentGateway,
  RefundRequest,
} from "./payment-gateway.ts";

export const TEST_CARDS = {
  success: "4242424242424242",
  declined: "4000000000000002",
} as const;

export class SimulatedPaymentGateway implements PaymentGateway {
  async charge(request: ChargeRequest): Promise<GatewayOutcome> {
    switch (request.cardNumber) {
      case TEST_CARDS.success:
        return { status: "succeeded" };
      case TEST_CARDS.declined:
        return { status: "failed", reason: "declined" };
      default:
        return { status: "failed", reason: "unknownCard" };
    }
  }

  async refund(_request: RefundRequest): Promise<GatewayOutcome> {
    return { status: "succeeded" };
  }
}
