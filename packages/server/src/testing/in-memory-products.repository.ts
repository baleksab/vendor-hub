import type {
  CategoryCount,
  NewProduct,
  NewProductImage,
  Product,
  ProductImage,
  ProductListItem,
  ProductPatch,
  ProductSearch,
} from "../products/product.ts";
import type { ProductsRepository } from "../products/products.repository.ts";
import type { InMemoryVendorsRepository } from "./in-memory-vendors.repository.ts";

type StoredProduct = Omit<Product, "images" | "vendorSlug" | "vendorName">;

export class InMemoryProductsRepository implements ProductsRepository {
  readonly rows: StoredProduct[] = [];
  readonly images: ProductImage[] = [];
  private readonly vendors: InMemoryVendorsRepository;

  constructor(vendors: InMemoryVendorsRepository) {
    this.vendors = vendors;
  }

  async create(input: NewProduct): Promise<Product> {
    const row: StoredProduct = {
      ...input,
      id: crypto.randomUUID(),
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: new Date(this.rows.length + 1),
    };

    this.rows.push(row);

    return this.toProduct(row) as Product;
  }

  async findById(id: string): Promise<Product | undefined> {
    return this.toProduct(this.rows.find((row) => row.id === id));
  }

  async update(id: string, patch: ProductPatch): Promise<Product | undefined> {
    const row = this.rows.find((candidate) => candidate.id === id);

    if (row === undefined || this.vendorOf(row) === undefined) {
      return undefined;
    }

    Object.assign(row, patch);

    return this.toProduct(row);
  }

  async softDelete(id: string): Promise<boolean> {
    const index = this.rows.findIndex((row) => row.id === id);

    if (index === -1) {
      return false;
    }

    this.rows.splice(index, 1);

    return true;
  }

  async search(
    vendorId: string,
    search: ProductSearch,
  ): Promise<{ items: ProductListItem[]; total: number }> {
    const matching = this.filtered(vendorId, search, true).sort((left, right) =>
      compare(left, right, search),
    );

    return {
      items: matching
        .slice(search.offset, search.offset + search.limit)
        .map((row) => this.toListItem(row)),
      total: matching.length,
    };
  }

  async categoryCounts(vendorId: string, search: ProductSearch): Promise<CategoryCount[]> {
    const counts = new Map<string, number>();

    for (const row of this.filtered(vendorId, search, false)) {
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((left, right) => left.category.localeCompare(right.category));
  }

  async addImage(productId: string, image: NewProductImage): Promise<ProductImage> {
    const existing = this.imagesOf(productId);
    const created: ProductImage = {
      id: crypto.randomUUID(),
      productId,
      position: existing.length === 0 ? 0 : Math.max(...existing.map((e) => e.position)) + 1,
      ...image,
    };

    this.images.push(created);

    return created;
  }

  async findImage(id: string): Promise<ProductImage | undefined> {
    const image = this.images.find((candidate) => candidate.id === id);
    const product = this.rows.find((row) => row.id === image?.productId);

    return product !== undefined && this.vendorOf(product) !== undefined ? image : undefined;
  }

  async reorderImages(productId: string, imageIds: string[]): Promise<void> {
    for (const [index, imageId] of imageIds.entries()) {
      const image = this.images.find(
        (candidate) => candidate.id === imageId && candidate.productId === productId,
      );

      if (image !== undefined) {
        image.position = index;
      }
    }
  }

  async removeImage(productId: string, imageId: string): Promise<boolean> {
    const index = this.images.findIndex(
      (image) => image.id === imageId && image.productId === productId,
    );

    if (index === -1) {
      return false;
    }

    this.images.splice(index, 1);

    return true;
  }

  private filtered(
    vendorId: string,
    search: ProductSearch,
    withCategory: boolean,
  ): StoredProduct[] {
    const q = search.q?.toLowerCase();

    return this.rows.filter(
      (row) =>
        row.vendorId === vendorId &&
        this.vendorOf(row) !== undefined &&
        (q === undefined ||
          row.name.toLowerCase().includes(q) ||
          row.description.toLowerCase().includes(q)) &&
        (!withCategory ||
          search.categories === undefined ||
          search.categories.includes(row.category)) &&
        (search.minRating === undefined || row.ratingAvg >= search.minRating) &&
        (search.minPrice === undefined || row.priceMinor >= search.minPrice) &&
        (search.maxPrice === undefined || row.priceMinor <= search.maxPrice) &&
        (search.inStock !== true || row.stock > 0),
    );
  }

  private vendorOf(row: StoredProduct) {
    return this.vendors.vendors.find((vendor) => vendor.id === row.vendorId);
  }

  private imagesOf(productId: string): ProductImage[] {
    return this.images
      .filter((image) => image.productId === productId)
      .sort((left, right) => left.position - right.position);
  }

  private toProduct(row: StoredProduct | undefined): Product | undefined {
    const vendor = row && this.vendorOf(row);

    if (row === undefined || vendor === undefined) {
      return undefined;
    }

    return {
      ...row,
      vendorSlug: vendor.slug,
      vendorName: vendor.name,
      images: this.imagesOf(row.id),
    };
  }

  private toListItem(row: StoredProduct): ProductListItem {
    return {
      id: row.id,
      category: row.category,
      name: row.name,
      priceMinor: row.priceMinor,
      currency: row.currency,
      stock: row.stock,
      ratingAvg: row.ratingAvg,
      ratingCount: row.ratingCount,
      coverImageId: this.imagesOf(row.id)[0]?.id ?? null,
      createdAt: row.createdAt,
    };
  }
}

function compare(left: StoredProduct, right: StoredProduct, search: ProductSearch): number {
  const newest = right.createdAt.getTime() - left.createdAt.getTime();
  let difference = 0;

  switch (search.sort) {
    case "relevance": {
      const q = search.q?.toLowerCase();
      const rank = (row: StoredProduct) =>
        q === undefined || row.name.toLowerCase().includes(q) ? 0 : 1;

      difference = rank(left) - rank(right) || newest;
      break;
    }
    case "priceAsc":
      difference = left.priceMinor - right.priceMinor;
      break;
    case "priceDesc":
      difference = right.priceMinor - left.priceMinor;
      break;
    case "rating":
      difference = right.ratingAvg - left.ratingAvg || right.ratingCount - left.ratingCount;
      break;
    case "name":
      difference = left.name.toLowerCase().localeCompare(right.name.toLowerCase());
      break;
    case "newest":
      difference = newest;
      break;
  }

  return difference !== 0 ? difference : left.id.localeCompare(right.id);
}
