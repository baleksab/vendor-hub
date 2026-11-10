import { and, asc, count, desc, eq, gte, inArray, lte, max, sql, type SQL } from "drizzle-orm";

import { notDeleted } from "../db/base-entity.ts";
import type { Database } from "../db/client.ts";
import { productImages, products, vendors } from "../db/schema.ts";
import { escapeLike } from "../shared/like.ts";
import type {
  CategoryCount,
  NewProduct,
  NewProductImage,
  Product,
  ProductImage,
  ProductListItem,
  ProductPatch,
  ProductSearch,
  ProductSnapshot,
} from "./product.ts";

export type ProductsRepository = {
  create(input: NewProduct): Promise<Product>;
  findById(id: string): Promise<Product | undefined>;
  findManyByIds(ids: string[]): Promise<ProductSnapshot[]>;
  update(id: string, patch: ProductPatch): Promise<Product | undefined>;
  softDelete(id: string): Promise<boolean>;
  search(
    vendorId: string,
    search: ProductSearch,
  ): Promise<{ items: ProductListItem[]; total: number }>;
  categoryCounts(vendorId: string, search: ProductSearch): Promise<CategoryCount[]>;
  addImage(productId: string, image: NewProductImage): Promise<ProductImage>;
  findImage(id: string): Promise<ProductImage | undefined>;
  reorderImages(productId: string, imageIds: string[]): Promise<void>;
  removeImage(productId: string, imageId: string): Promise<boolean>;
};

const SOFT_DELETE = () => ({ isDeleted: true, deletedAt: sql`now()` });

function nameMatch(pattern: string): SQL {
  return sql`lower(${products.name}) like ${pattern}`;
}

function searchConditions(
  vendorId: string,
  search: ProductSearch,
  withCategory: boolean,
): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [eq(products.vendorId, vendorId), notDeleted(products)];

  if (search.q !== undefined) {
    const pattern = `%${escapeLike(search.q.toLowerCase())}%`;

    conditions.push(sql`(${nameMatch(pattern)} or lower(${products.description}) like ${pattern})`);
  }

  if (withCategory && search.categories !== undefined) {
    conditions.push(inArray(products.category, search.categories));
  }

  if (search.minRating !== undefined) {
    conditions.push(gte(products.ratingAvg, search.minRating));
  }

  if (search.minPrice !== undefined) {
    conditions.push(gte(products.priceMinor, search.minPrice));
  }

  if (search.maxPrice !== undefined) {
    conditions.push(lte(products.priceMinor, search.maxPrice));
  }

  if (search.inStock === true) {
    conditions.push(sql`${products.stock} > 0`);
  }

  return conditions;
}

function orderFor(search: ProductSearch): SQL[] {
  const tieBreak = asc(products.id);

  switch (search.sort) {
    case "relevance": {
      if (search.q === undefined) {
        return [desc(products.createdAt), tieBreak];
      }

      const pattern = `%${escapeLike(search.q.toLowerCase())}%`;

      return [
        sql`case when ${nameMatch(pattern)} then 0 else 1 end`,
        desc(products.createdAt),
        tieBreak,
      ];
    }
    case "priceAsc":
      return [asc(products.priceMinor), tieBreak];
    case "priceDesc":
      return [desc(products.priceMinor), tieBreak];
    case "rating":
      return [desc(products.ratingAvg), desc(products.ratingCount), tieBreak];
    case "name":
      return [asc(sql`lower(${products.name})`), tieBreak];
    case "newest":
      return [desc(products.createdAt), tieBreak];
  }
}

export class DrizzleProductsRepository implements ProductsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async create(input: NewProduct): Promise<Product> {
    const [row] = await this.db.insert(products).values(input).returning({ id: products.id });

    if (row === undefined) {
      throw new Error("Insert returned no row");
    }

    const product = await this.findById(row.id);

    if (product === undefined) {
      throw new Error("Created product not found");
    }

    return product;
  }

  async findById(id: string): Promise<Product | undefined> {
    const [row] = await this.db
      .select({
        id: products.id,
        vendorId: products.vendorId,
        vendorSlug: vendors.slug,
        vendorName: vendors.name,
        category: products.category,
        name: products.name,
        description: products.description,
        priceMinor: products.priceMinor,
        currency: products.currency,
        stock: products.stock,
        seoTitle: products.seoTitle,
        seoDescription: products.seoDescription,
        seoImageId: products.seoImageId,
        ratingAvg: products.ratingAvg,
        ratingCount: products.ratingCount,
        createdAt: products.createdAt,
      })
      .from(products)
      .innerJoin(vendors, and(eq(vendors.id, products.vendorId), notDeleted(vendors)))
      .where(and(eq(products.id, id), notDeleted(products)));

    if (row === undefined) {
      return undefined;
    }

    const images = await this.db
      .select()
      .from(productImages)
      .where(and(eq(productImages.productId, id), notDeleted(productImages)))
      .orderBy(asc(productImages.position));

    return {
      ...row,
      currency: row.currency as Product["currency"],
      images: images.map(toImage),
    };
  }

  async findManyByIds(ids: string[]): Promise<ProductSnapshot[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.db
      .select({
        id: products.id,
        vendorId: products.vendorId,
        vendorSlug: vendors.slug,
        vendorName: vendors.name,
        name: products.name,
        priceMinor: products.priceMinor,
        currency: products.currency,
        stock: products.stock,
      })
      .from(products)
      .innerJoin(vendors, and(eq(vendors.id, products.vendorId), notDeleted(vendors)))
      .where(and(inArray(products.id, ids), notDeleted(products)));

    const covers = await this.coverImages(rows.map((row) => row.id));

    return rows.map((row) => ({
      ...row,
      currency: row.currency as ProductSnapshot["currency"],
      coverImageId: covers.get(row.id) ?? null,
    }));
  }

  async update(id: string, patch: ProductPatch): Promise<Product | undefined> {
    const rows = await this.db
      .update(products)
      .set(patch)
      .where(and(eq(products.id, id), notDeleted(products)))
      .returning({ id: products.id });

    return rows.length === 0 ? undefined : this.findById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const rows = await this.db
      .update(products)
      .set(SOFT_DELETE())
      .where(and(eq(products.id, id), notDeleted(products)))
      .returning({ id: products.id });

    return rows.length > 0;
  }

  async search(
    vendorId: string,
    search: ProductSearch,
  ): Promise<{ items: ProductListItem[]; total: number }> {
    const where = and(...searchConditions(vendorId, search, true));

    const rows = await this.db
      .select({
        id: products.id,
        category: products.category,
        name: products.name,
        priceMinor: products.priceMinor,
        currency: products.currency,
        stock: products.stock,
        ratingAvg: products.ratingAvg,
        ratingCount: products.ratingCount,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(where)
      .orderBy(...orderFor(search))
      .limit(search.limit)
      .offset(search.offset);

    const [totalRow] = await this.db.select({ total: count() }).from(products).where(where);

    const covers = await this.coverImages(rows.map((row) => row.id));

    return {
      items: rows.map((row) => ({
        ...row,
        currency: row.currency as ProductListItem["currency"],
        coverImageId: covers.get(row.id) ?? null,
      })),
      total: totalRow?.total ?? 0,
    };
  }

  private async coverImages(productIds: string[]): Promise<Map<string, string>> {
    const covers = new Map<string, string>();

    if (productIds.length === 0) {
      return covers;
    }

    const images = await this.db
      .select({ id: productImages.id, productId: productImages.productId })
      .from(productImages)
      .where(and(inArray(productImages.productId, productIds), notDeleted(productImages)))
      .orderBy(desc(productImages.position));

    for (const image of images) {
      covers.set(image.productId, image.id);
    }

    return covers;
  }

  async categoryCounts(vendorId: string, search: ProductSearch): Promise<CategoryCount[]> {
    return this.db
      .select({ category: products.category, count: count() })
      .from(products)
      .where(and(...searchConditions(vendorId, search, false)))
      .groupBy(products.category)
      .orderBy(asc(products.category));
  }

  async addImage(productId: string, image: NewProductImage): Promise<ProductImage> {
    const [last] = await this.db
      .select({ position: max(productImages.position) })
      .from(productImages)
      .where(and(eq(productImages.productId, productId), notDeleted(productImages)));

    const position = last?.position === null || last === undefined ? 0 : last.position + 1;

    const [row] = await this.db
      .insert(productImages)
      .values({ productId, position, ...image })
      .returning();

    if (row === undefined) {
      throw new Error("Insert returned no row");
    }

    return toImage(row);
  }

  async findImage(id: string): Promise<ProductImage | undefined> {
    const [row] = await this.db
      .select({
        id: productImages.id,
        productId: productImages.productId,
        position: productImages.position,
        contentType: productImages.contentType,
        byteSize: productImages.byteSize,
      })
      .from(productImages)
      .innerJoin(products, and(eq(products.id, productImages.productId), notDeleted(products)))
      .innerJoin(vendors, and(eq(vendors.id, products.vendorId), notDeleted(vendors)))
      .where(and(eq(productImages.id, id), notDeleted(productImages)));

    return row;
  }

  async reorderImages(productId: string, imageIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const [index, imageId] of imageIds.entries()) {
        await tx
          .update(productImages)
          .set({ position: -(index + 1) })
          .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)));
      }

      for (const [index, imageId] of imageIds.entries()) {
        await tx
          .update(productImages)
          .set({ position: index })
          .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)));
      }
    });
  }

  async removeImage(productId: string, imageId: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .update(productImages)
        .set(SOFT_DELETE())
        .where(
          and(
            eq(productImages.id, imageId),
            eq(productImages.productId, productId),
            notDeleted(productImages),
          ),
        )
        .returning({ id: productImages.id });

      if (rows.length === 0) {
        return false;
      }

      await tx
        .update(products)
        .set({ seoImageId: null })
        .where(and(eq(products.id, productId), eq(products.seoImageId, imageId)));

      return true;
    });
  }
}

function toImage(row: {
  id: string;
  productId: string;
  position: number;
  contentType: string;
  byteSize: number;
}): ProductImage {
  return {
    id: row.id,
    productId: row.productId,
    position: row.position,
    contentType: row.contentType,
    byteSize: row.byteSize,
  };
}
