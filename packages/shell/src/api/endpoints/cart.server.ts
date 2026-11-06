import { unwrap } from "@vendor-hub/api-client";
import type { CartLineRequest, CartQuoteResponse } from "@vendor-hub/types";
import { createServerApi } from "../createServerApi.server";

export function quoteCart(lines: CartLineRequest[]): Promise<CartQuoteResponse> {
  return unwrap(createServerApi().POST("/api/v1/cart/quote", { body: { lines } }));
}
