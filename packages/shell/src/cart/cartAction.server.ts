import { data } from "react-router";
import { z } from "zod";

import { quoteCart } from "../api/endpoints/cart.server";
import { assertSameOrigin } from "../auth/sameOrigin.server";
import { readValues } from "../forms/formErrors.server";
import type { MessageKey } from "../i18n";
import { addLine, reconcile, removeLine, setQuantity, type CartLine } from "./cartLines";
import {
  CartCookieTooLarge,
  cartLimits,
  commitCart,
  getCartSession,
  readLines,
  writeLines,
} from "./cartSession.server";

const BAD_REQUEST = 400;
const BAD_GATEWAY = 502;

const productId = z.uuid();
const quantity = z.coerce.number().int().min(0);

const CartIntent = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("add"), productId, quantity: quantity.min(1) }),
  z.object({ intent: z.literal("setQuantity"), productId, quantity }),
  z.object({ intent: z.literal("remove"), productId }),
  z.object({ intent: z.literal("clear") }),
  z.object({ intent: z.literal("reconcile") }),
]);

export type CartActionResult =
  | { ok: true; intent: string; productId: string | null }
  | { ok: false; error: MessageKey; productId: string | null };

function fail(error: MessageKey, id: string | null, status = BAD_REQUEST) {
  return data<CartActionResult>({ ok: false, error, productId: id }, { status });
}

export async function cartAction(request: Request) {
  assertSameOrigin(request);

  const parsed = CartIntent.safeParse(await readValues(request));

  if (!parsed.success) {
    throw data(null, { status: BAD_REQUEST });
  }

  const intent = parsed.data;
  const id = "productId" in intent ? intent.productId : null;
  const session = await getCartSession(request);
  const lines = readLines(session);
  const limits = cartLimits();
  let next: CartLine[];

  switch (intent.intent) {
    case "add": {
      const added = addLine(lines, intent.productId, intent.quantity, limits);

      if (!added.ok) {
        return fail("cart.error.tooManyLines", id);
      }

      next = added.lines;
      break;
    }
    case "setQuantity":
      next = setQuantity(lines, intent.productId, intent.quantity, limits);
      break;
    case "remove":
      next = removeLine(lines, intent.productId);
      break;
    case "clear":
      next = [];
      break;
    case "reconcile":
      try {
        next = lines.length === 0 ? [] : reconcile(lines, (await quoteCart(lines)).lines);
      } catch {
        return fail("cart.error.quote", id, BAD_GATEWAY);
      }
      break;
  }

  writeLines(session, next);

  try {
    const cookie = await commitCart(session);

    return data<CartActionResult>(
      { ok: true, intent: intent.intent, productId: id },
      { headers: { "Set-Cookie": cookie } },
    );
  } catch (error) {
    if (error instanceof CartCookieTooLarge) {
      return fail("cart.error.tooLarge", id);
    }

    throw error;
  }
}
