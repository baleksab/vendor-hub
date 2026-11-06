import { redirect } from "react-router";
import { z } from "zod";

import { payOrder } from "../../api/endpoints/orders.server";
import { assertSameOrigin } from "../../auth/sameOrigin.server";
import { requireUser } from "../../auth/session.server";
import { orderPath } from "../../cart/cartPaths";
import { message } from "../../forms/fields";
import { failed, invalid, readValues } from "../../forms/formErrors.server";

const CARD_PATTERN = /^\d{12,19}$/;
const WHITESPACE = /\s+/g;

export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .transform((value) => value.replace(WHITESPACE, ""))
    .pipe(z.string().regex(CARD_PATTERN, message("payment.validation.card"))),
});

export async function paymentAction(request: Request, orderId: string) {
  assertSameOrigin(request);

  const session = await requireUser(request);
  const values = await readValues(request);
  const parsed = paymentSchema.safeParse(values);

  if (!parsed.success) {
    return invalid(parsed.error, {});
  }

  try {
    const result = await payOrder(session.token, orderId, parsed.data.cardNumber);

    if (result.payment.status === "succeeded") {
      return redirect(`${orderPath(orderId)}?paid=1`);
    }

    return {
      outcome: result.order.status === "cancelled" ? ("cancelled" as const) : ("failed" as const),
      reason: result.payment.failureReason,
      attemptsLeft: result.payment.attemptsLeft,
    };
  } catch (error) {
    return failed(error, "generic", {});
  }
}
