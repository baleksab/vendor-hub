import { and, eq, gte, sql } from "drizzle-orm";

import { notDeleted } from "../db/base-entity.ts";
import type { Transaction } from "../db/client.ts";
import { products } from "../db/schema.ts";

export async function decrementStock(
  tx: Transaction,
  productId: string,
  quantity: number,
): Promise<boolean> {
  const rows = await tx
    .update(products)
    .set({ stock: sql`${products.stock} - ${quantity}` })
    .where(and(eq(products.id, productId), gte(products.stock, quantity), notDeleted(products)))
    .returning({ id: products.id });

  return rows.length > 0;
}

export async function incrementStock(
  tx: Transaction,
  productId: string,
  quantity: number,
): Promise<void> {
  await tx
    .update(products)
    .set({ stock: sql`${products.stock} + ${quantity}` })
    .where(and(eq(products.id, productId), notDeleted(products)));
}
