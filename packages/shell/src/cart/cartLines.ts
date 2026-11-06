import { z } from "zod";

export const CART_VERSION = 1;

export type CartLine = { productId: string; quantity: number };

export type CartLimits = { maxLines: number; maxQuantityPerLine: number };

export type CartChange = { ok: true; lines: CartLine[] } | { ok: false; reason: "tooManyLines" };

type QuotedLine = { productId: string; quantity: number; status: string };

const StoredCart = z.object({
  v: z.literal(CART_VERSION),
  lines: z.array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1) })),
});

export function parseLines(value: unknown, limits: CartLimits): CartLine[] {
  const parsed = StoredCart.safeParse(value);

  if (!parsed.success) {
    return [];
  }

  let lines: CartLine[] = [];

  for (const line of parsed.data.lines) {
    const merged = addLine(lines, line.productId, line.quantity, limits);

    if (!merged.ok) {
      break;
    }

    lines = merged.lines;
  }

  return lines;
}

export function serializeLines(lines: CartLine[]) {
  return { v: CART_VERSION, lines };
}

export function addLine(
  lines: CartLine[],
  productId: string,
  quantity: number,
  limits: CartLimits,
): CartChange {
  const existing = lines.find((line) => line.productId === productId);

  if (existing === undefined) {
    if (lines.length >= limits.maxLines) {
      return { ok: false, reason: "tooManyLines" };
    }

    return { ok: true, lines: [...lines, { productId, quantity: clamp(quantity, limits) }] };
  }

  return {
    ok: true,
    lines: lines.map((line) =>
      line.productId === productId
        ? { productId, quantity: clamp(line.quantity + quantity, limits) }
        : line,
    ),
  };
}

export function setQuantity(
  lines: CartLine[],
  productId: string,
  quantity: number,
  limits: CartLimits,
): CartLine[] {
  if (quantity <= 0) {
    return removeLine(lines, productId);
  }

  return lines.map((line) =>
    line.productId === productId ? { productId, quantity: clamp(quantity, limits) } : line,
  );
}

export function removeLine(lines: CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.productId !== productId);
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function reconcile(lines: CartLine[], quoted: QuotedLine[]): CartLine[] {
  const byId = new Map(quoted.map((line) => [line.productId, line]));

  return lines.flatMap((line) => {
    const quote = byId.get(line.productId);

    if (quote === undefined) {
      return [line];
    }

    return quote.quantity > 0 ? [{ productId: line.productId, quantity: quote.quantity }] : [];
  });
}

function clamp(quantity: number, limits: CartLimits): number {
  return Math.min(Math.max(1, Math.trunc(quantity)), limits.maxQuantityPerLine);
}
