import type { Currency } from "../products/currencies.ts";
import type { ProductSnapshot } from "../products/product.ts";
import type { ProductsRepository } from "../products/products.repository.ts";
import { BadRequestError } from "../shared/errors.ts";
import type { CART_LINE_STATUSES, CartLineRequest } from "./cart.schemas.ts";

export type CartLineStatus = (typeof CART_LINE_STATUSES)[number];

export type QuotedLine = {
  productId: string;
  requestedQuantity: number;
  quantity: number;
  status: CartLineStatus;
  product: ProductSnapshot | null;
  lineTotalMinor: number;
};

export type CurrencyTotal = { currency: Currency; totalMinor: number };

export type Quote = {
  lines: QuotedLine[];
  totals: CurrencyTotal[];
  canCheckout: boolean;
};

export type CartLimits = { maxLines: number };

export class CartService {
  private readonly products: ProductsRepository;
  private readonly limits: CartLimits;

  constructor(products: ProductsRepository, limits: CartLimits) {
    this.products = products;
    this.limits = limits;
  }

  async quote(lines: CartLineRequest[]): Promise<Quote> {
    const merged = mergeLines(lines);

    if (merged.length > this.limits.maxLines) {
      throw new BadRequestError(`A cart can have at most ${this.limits.maxLines} products`);
    }

    const found = await this.products.findManyByIds(merged.map((line) => line.productId));
    const byId = new Map(found.map((product) => [product.id, product]));
    const quoted = merged.map((line) => quoteLine(line, byId.get(line.productId)));

    return {
      lines: quoted,
      totals: totalsByCurrency(quoted),
      canCheckout: quoted.length > 0 && quoted.every((line) => line.status === "ok"),
    };
  }
}

export function mergeLines(lines: CartLineRequest[]): CartLineRequest[] {
  const quantities = new Map<string, number>();

  for (const line of lines) {
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  }

  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

function quoteLine(line: CartLineRequest, product: ProductSnapshot | undefined): QuotedLine {
  const base = { productId: line.productId, requestedQuantity: line.quantity };

  if (product === undefined) {
    return { ...base, quantity: 0, status: "unavailable", product: null, lineTotalMinor: 0 };
  }

  if (product.stock <= 0) {
    return { ...base, quantity: 0, status: "outOfStock", product, lineTotalMinor: 0 };
  }

  const quantity = Math.min(line.quantity, product.stock);

  return {
    ...base,
    quantity,
    status: quantity < line.quantity ? "quantityReduced" : "ok",
    product,
    lineTotalMinor: quantity * product.priceMinor,
  };
}

function totalsByCurrency(lines: QuotedLine[]): CurrencyTotal[] {
  const totals = new Map<Currency, number>();

  for (const line of lines) {
    if (line.product !== null && line.quantity > 0) {
      const { currency } = line.product;

      totals.set(currency, (totals.get(currency) ?? 0) + line.lineTotalMinor);
    }
  }

  return [...totals].map(([currency, totalMinor]) => ({ currency, totalMinor }));
}
