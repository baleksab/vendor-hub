import { data } from "react-router";
import { z } from "zod";

import { cancelOrder, confirmReceipt, requestReturn } from "../../api/endpoints/orders.server";
import { assertSameOrigin } from "../../auth/sameOrigin.server";
import { requireUser } from "../../auth/session.server";
import { message } from "../../forms/fields";
import { failed, invalid, readValues } from "../../forms/formErrors.server";

const BAD_REQUEST = 400;
const REASON_MAX = 1000;

const OrderIntent = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("cancel") }),
  z.object({ intent: z.literal("confirmReceipt") }),
  z.object({
    intent: z.literal("requestReturn"),
    reason: z
      .string()
      .trim()
      .min(1, message("validation.required"))
      .max(REASON_MAX, message("validation.tooLong")),
  }),
]);

export async function orderAction(request: Request, orderId: string) {
  assertSameOrigin(request);

  const session = await requireUser(request);
  const values = await readValues(request);
  const parsed = OrderIntent.safeParse(values);

  if (!parsed.success) {
    if (values.intent === "requestReturn") {
      return invalid(parsed.error, values);
    }

    throw data(null, { status: BAD_REQUEST });
  }

  try {
    switch (parsed.data.intent) {
      case "cancel":
        await cancelOrder(session.token, orderId);
        break;
      case "confirmReceipt":
        await confirmReceipt(session.token, orderId);
        break;
      case "requestReturn":
        await requestReturn(session.token, orderId, parsed.data.reason);
        break;
    }
  } catch (error) {
    return failed(error, "generic", values);
  }

  return { ok: true as const, intent: parsed.data.intent };
}
