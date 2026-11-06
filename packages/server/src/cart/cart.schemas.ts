import { z } from "zod";

import { CURRENCIES } from "../products/currencies.ts";
import { MAX_STOCK } from "../products/products.schemas.ts";

export const CART_LINE_STATUSES = ["ok", "quantityReduced", "outOfStock", "unavailable"] as const;

export const CartLineRequest = z
  .object({
    productId: z.uuid(),
    quantity: z.number().int().min(1).max(MAX_STOCK),
  })
  .meta({ id: "CartLineRequest" });

export const CartQuoteRequest = z
  .object({ lines: z.array(CartLineRequest).min(1) })
  .meta({ id: "CartQuoteRequest" });

export const CartProductResponse = z
  .object({
    id: z.uuid(),
    name: z.string(),
    vendorId: z.uuid(),
    vendorSlug: z.string(),
    vendorName: z.string(),
    priceMinor: z.number().int(),
    currency: z.enum(CURRENCIES),
    stock: z.number().int(),
    coverImageId: z.uuid().nullable(),
  })
  .meta({ id: "CartProductResponse" });

export const CartQuoteLineResponse = z
  .object({
    productId: z.uuid(),
    requestedQuantity: z.number().int(),
    quantity: z.number().int().min(0),
    status: z.enum(CART_LINE_STATUSES),
    product: CartProductResponse.nullable(),
    lineTotalMinor: z.number().int().min(0),
  })
  .meta({ id: "CartQuoteLineResponse" });

export const CurrencyTotalResponse = z
  .object({ currency: z.enum(CURRENCIES), totalMinor: z.number().int().min(0) })
  .meta({ id: "CurrencyTotalResponse" });

export const CartQuoteResponse = z
  .object({
    lines: z.array(CartQuoteLineResponse),
    totals: z.array(CurrencyTotalResponse),
    canCheckout: z.boolean(),
  })
  .meta({ id: "CartQuoteResponse" });

export type CartLineRequest = z.infer<typeof CartLineRequest>;
export type CartQuoteRequest = z.infer<typeof CartQuoteRequest>;
export type CartQuoteResponse = z.infer<typeof CartQuoteResponse>;
export type CartQuoteLineResponse = z.infer<typeof CartQuoteLineResponse>;
