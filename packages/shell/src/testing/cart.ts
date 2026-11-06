import type { CartLine } from "../cart/cartLines";
import type { CheckoutDetails } from "../cart/checkoutDetails";
import { ORIGIN, TOKEN } from "./actions";

type CartCookieInput = {
  lines?: CartLine[];
  checkout?: CheckoutDetails;
  checkoutKey?: string;
};

export async function cartCookie(input: CartCookieInput): Promise<string> {
  const session = await import("../cart/cartSession.server");
  const cart = await session.getCartSession(new Request(ORIGIN));

  if (input.lines !== undefined) {
    session.writeLines(cart, input.lines);
  }

  if (input.checkout !== undefined) {
    session.writeCheckout(cart, input.checkout);
  }

  if (input.checkoutKey !== undefined) {
    cart.set("checkoutKey", input.checkoutKey);
  }

  return (await session.commitCart(cart)).split(";")[0] ?? "";
}

export async function tokenCookie(): Promise<string> {
  const { commitToken } = await import("../auth/sessionCookie.server");

  return (await commitToken(TOKEN, 60)).split(";")[0] ?? "";
}

export function postForm(url: string, values: Record<string, string>, cookies: string[] = []) {
  return new Request(url, {
    method: "POST",
    headers: {
      Origin: ORIGIN,
      Cookie: cookies.join("; "),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(values),
  });
}

export function getRequest(url: string, cookies: string[] = []) {
  return new Request(url, { headers: { Cookie: cookies.join("; ") } });
}

export async function readCartCookie(setCookie: string | null) {
  const session = await import("../cart/cartSession.server");
  const cookie = (setCookie ?? "").split(";")[0] ?? "";
  const cart = await session.getCartSession(new Request(ORIGIN, { headers: { Cookie: cookie } }));

  return {
    lines: session.readLines(cart),
    checkout: session.readCheckout(cart),
    hasKey: cart.has("checkoutKey"),
  };
}
