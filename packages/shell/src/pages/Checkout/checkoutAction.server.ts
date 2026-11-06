import { data, redirect } from "react-router";

import { ApiError } from "@vendor-hub/api-client";
import type { CreateOrdersResponse } from "@vendor-hub/types";
import { quoteCart } from "../../api/endpoints/cart.server";
import { loadCountries } from "../../api/endpoints/countries.server";
import { createOrders } from "../../api/endpoints/orders.server";
import { assertSameOrigin } from "../../auth/sameOrigin.server";
import { getSession } from "../../auth/session.server";
import { reconcile } from "../../cart/cartLines";
import { CART_PATH, CHECKOUT_PATH, ORDERS_PATH, orderPath } from "../../cart/cartPaths";
import {
  CartCookieTooLarge,
  commitCart,
  finishCheckout,
  getCartSession,
  readLines,
  writeCheckout,
  writeLines,
  type CartSession,
} from "../../cart/cartSession.server";
import { failed, invalid, readValues, type FormErrors } from "../../forms/formErrors.server";
import { createCheckoutSchema, toShipping } from "./checkoutSchema";

const CONFLICT = 409;
const BAD_REQUEST = 400;

export const REGISTER_FOR_CHECKOUT = `/register?redirectTo=${encodeURIComponent(CHECKOUT_PATH)}`;

async function redirectWithCart(location: string, cart: CartSession) {
  return redirect(location, { headers: { "Set-Cookie": await commitCart(cart) } });
}

async function cartChanged(cart: CartSession, lines: Parameters<typeof quoteCart>[0]) {
  try {
    writeLines(cart, reconcile(lines, (await quoteCart(lines)).lines));
  } catch {
    writeLines(cart, lines);
  }

  return redirectWithCart(`${CART_PATH}?changed=1`, cart);
}

export async function checkoutAction(request: Request) {
  assertSameOrigin(request);

  const values = await readValues(request);
  let countries: string[];

  try {
    countries = await loadCountries();
  } catch (error) {
    return failed(error, "generic", values);
  }

  const parsed = createCheckoutSchema(countries).safeParse(values);

  if (!parsed.success) {
    return invalid(parsed.error, values);
  }

  const cart = await getCartSession(request);
  const lines = readLines(cart);

  if (lines.length === 0) {
    throw redirect(CART_PATH);
  }

  const shipping = toShipping(parsed.data);
  const { session } = await getSession(request);

  try {
    if (session === null) {
      writeCheckout(cart, shipping);

      return await redirectWithCart(REGISTER_FOR_CHECKOUT, cart);
    }

    let created: CreateOrdersResponse;

    try {
      created = await createOrders(session.token, {
        lines,
        shipping,
        idempotencyKey: parsed.data.idempotencyKey,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === CONFLICT) {
        return await cartChanged(cart, lines);
      }

      return failed(error, "generic", values);
    }

    finishCheckout(cart);

    const [first] = created.data;
    const target =
      created.data.length === 1 && first !== undefined
        ? `${orderPath(first.id)}?placed=1`
        : `${ORDERS_PATH}?placed=1`;

    return await redirectWithCart(target, cart);
  } catch (error) {
    if (error instanceof CartCookieTooLarge) {
      const errors: FormErrors = { form: "cart.error.tooLarge", fields: {}, values };

      return data(errors, { status: BAD_REQUEST });
    }

    throw error;
  }
}
