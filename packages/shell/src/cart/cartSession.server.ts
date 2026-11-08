import { createCookieSessionStorage, type Session } from "react-router";
import { z } from "zod";

import { getSession } from "../auth/session.server";
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
  owner: unknown;
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

export function readOwner(session: CartSession): string | null {
  const owner = z.string().min(1).safeParse(session.get("owner"));

  return owner.success ? owner.data : null;
}

function bindToOwner(session: CartSession, userId: string | null): void {
  const owner = readOwner(session);
  const isGuestCartClaimedByUser = owner === null && userId !== null;

  if (owner !== userId && !isGuestCartClaimedByUser) {
    session.unset("cart");
    session.unset("checkout");
    session.unset("checkoutKey");
  }

  if (userId === null) {
    session.unset("owner");
  } else {
    session.set("owner", userId);
  }
}

export function loadCartSession(request: Request): Promise<CartSession> {
  return storage().getSession(request.headers.get("Cookie"));
}

export async function getCartSession(request: Request): Promise<CartSession> {
  const session = await loadCartSession(request);
  const { session: auth } = await getSession(request);

  bindToOwner(session, auth?.user.id ?? null);

  return session;
}

export async function claimCart(request: Request, userId: string): Promise<string> {
  const session = await loadCartSession(request);

  bindToOwner(session, userId);

  return commitCart(session);
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

export async function cartItemCount(request: Request): Promise<number> {
  return countItems(readLines(await getCartSession(request)));
}
