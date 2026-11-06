import { createCookieSessionStorage, type Session } from "react-router";
import { z } from "zod";

import { getEnv } from "../env.server";
import {
  countItems,
  parseLines,
  serializeLines,
  type CartLimits,
  type CartLine,
} from "./cartLines";
import { CheckoutDetailsSchema, type CheckoutDetails } from "./checkoutDetails";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const COOKIE_MAX_BYTES = 4096;

type CartSessionData = {
  cart: unknown;
  checkout: unknown;
  checkoutKey: unknown;
};

export type CartSession = Session<CartSessionData>;

export class CartCookieTooLarge extends Error {}

function storage() {
  const env = getEnv();

  return createCookieSessionStorage<CartSessionData>({
    cookie: {
      name: env.cartCookieName,
      httpOnly: true,
      secure: env.sessionCookieSecure,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
      secrets: [env.sessionSecret],
    },
  });
}

export function cartLimits(): CartLimits {
  const env = getEnv();

  return { maxLines: env.cartMaxLines, maxQuantityPerLine: env.cartMaxQuantityPerLine };
}

export function getCartSession(request: Request): Promise<CartSession> {
  return storage().getSession(request.headers.get("Cookie"));
}

export function readLines(session: CartSession): CartLine[] {
  return parseLines(session.get("cart"), cartLimits());
}

export function writeLines(session: CartSession, lines: CartLine[]): void {
  session.set("cart", serializeLines(lines));
}

export function readCheckout(session: CartSession): CheckoutDetails | null {
  const parsed = CheckoutDetailsSchema.safeParse(session.get("checkout"));

  return parsed.success ? parsed.data : null;
}

export function writeCheckout(session: CartSession, details: CheckoutDetails): void {
  session.set("checkout", details);
}

export function checkoutKey(session: CartSession): string {
  const stored = z.uuid().safeParse(session.get("checkoutKey"));

  if (stored.success) {
    return stored.data;
  }

  const key = crypto.randomUUID();

  session.set("checkoutKey", key);

  return key;
}

export function finishCheckout(session: CartSession): void {
  session.unset("cart");
  session.unset("checkout");
  session.unset("checkoutKey");
}

export async function commitCart(session: CartSession): Promise<string> {
  const cookie = await storage().commitSession(session);
  const value = cookie.split(";")[0] ?? "";

  if (new TextEncoder().encode(value).byteLength > COOKIE_MAX_BYTES) {
    throw new CartCookieTooLarge();
  }

  return cookie;
}

export async function clearCart(): Promise<string> {
  const store = storage();

  return store.destroySession(await store.getSession());
}

export async function cartItemCount(request: Request): Promise<number> {
  return countItems(readLines(await getCartSession(request)));
}
