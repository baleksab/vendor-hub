import { expandCategory } from "../categories/categories.ts";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
} from "../shared/errors.ts";
import { resolveAccess, type Actor } from "../vendors/vendor-access.ts";
import type { VendorsRepository } from "../vendors/vendors.repository.ts";
import type { ImageStorage } from "./image-storage.ts";
import { detectImageType } from "./image-type.ts";
import type {
  CategoryCount,
  Product,
  ProductImage,
  ProductListItem,
  ProductSearch,
} from "./product.ts";
import type { ProductsRepository } from "./products.repository.ts";
import type {
  CreateProductRequest,
  ProductCategoryCountsQuery,
  SearchProductsQuery,
  UpdateProductRequest,
} from "./products.schemas.ts";

export type ImageLimits = {
  maxBytes: number;
  maxPerProduct: number;
};

export class ProductsService {
  private readonly products: ProductsRepository;
  private readonly vendors: VendorsRepository;
  private readonly storage: ImageStorage;
  private readonly limits: ImageLimits;

  constructor(
    products: ProductsRepository,
    vendors: VendorsRepository,
    storage: ImageStorage,
    limits: ImageLimits,
  ) {
    this.products = products;
    this.vendors = vendors;
    this.storage = storage;
    this.limits = limits;
  }

  async search(
    slug: string,
    query: SearchProductsQuery,
  ): Promise<{ items: ProductListItem[]; total: number }> {
    const vendorId = await this.vendorIdBySlug(slug);

    return this.products.search(vendorId, toSearch(query));
  }

  async categoryCounts(slug: string, query: ProductCategoryCountsQuery): Promise<CategoryCount[]> {
    const vendorId = await this.vendorIdBySlug(slug);

    return this.products.categoryCounts(vendorId, toSearch({ ...query, limit: 1, offset: 0 }));
  }

  async get(id: string): Promise<Product> {
    const product = await this.products.findById(id);

    if (product === undefined) {
      throw productNotFound();
    }

    return product;
  }

  async create(actor: Actor, vendorId: string, request: CreateProductRequest): Promise<Product> {
    await this.requireVendorAccess(actor, vendorId);

    return this.products.create({ ...request, vendorId });
  }

  async update(actor: Actor, id: string, request: UpdateProductRequest): Promise<Product> {
    await this.requireManaged(actor, id);

    const product = await this.products.update(id, request);

    if (product === undefined) {
      throw productNotFound();
    }

    return product;
  }

  async delete(actor: Actor, id: string): Promise<void> {
    const product = await this.requireManaged(actor, id);

    if (!(await this.products.softDelete(id))) {
      throw productNotFound();
    }

    await Promise.all(product.images.map((image) => this.storage.remove(image.id)));
  }

  async addImage(actor: Actor, id: string, data: Buffer): Promise<ProductImage> {
    const product = await this.requireManaged(actor, id);

    if (data.byteLength > this.limits.maxBytes) {
      throw new PayloadTooLargeError(`The image is larger than ${this.limits.maxBytes} bytes`);
    }

    const contentType = detectImageType(data);

    if (contentType === undefined) {
      throw new UnsupportedMediaTypeError("Only JPEG, PNG and WebP images are accepted");
    }

    if (product.images.length >= this.limits.maxPerProduct) {
      throw new ConflictError(`A product can have at most ${this.limits.maxPerProduct} images`);
    }

    const image = await this.products.addImage(id, { contentType, byteSize: data.byteLength });

    await this.storage.save(image.id, data);

    return image;
  }

  async reorderImages(actor: Actor, id: string, imageIds: string[]): Promise<Product> {
    const product = await this.requireManaged(actor, id);
    const current = new Set(product.images.map((image) => image.id));

    if (imageIds.length !== current.size || !imageIds.every((imageId) => current.has(imageId))) {
      throw new BadRequestError("The list must contain exactly the current images");
    }

    if (new Set(imageIds).size !== imageIds.length) {
      throw new BadRequestError("The list must not repeat images");
    }

    await this.products.reorderImages(id, imageIds);

    return this.get(id);
  }

  async removeImage(actor: Actor, id: string, imageId: string): Promise<void> {
    await this.requireManaged(actor, id);

    if (!(await this.products.removeImage(id, imageId))) {
      throw new NotFoundError("Image not found");
    }

    await this.storage.remove(imageId);
  }

  async readImage(id: string): Promise<{ image: ProductImage; data: Buffer }> {
    const image = await this.products.findImage(id);
    const data = image && (await this.storage.read(image.id));

    if (image === undefined || data === undefined) {
      throw new NotFoundError("Image not found");
    }

    return { image, data };
  }

  private async vendorIdBySlug(slug: string): Promise<string> {
    const vendor = await this.vendors.findBySlug(slug);

    if (vendor === undefined) {
      throw new NotFoundError(`Vendor ${slug} not found`);
    }

    return vendor.id;
  }

  private async requireVendorAccess(actor: Actor, vendorId: string): Promise<void> {
    const vendor = await this.vendors.findById(vendorId);

    if (vendor === undefined || resolveAccess(actor, vendor) === undefined) {
      throw new NotFoundError("Vendor not found");
    }
  }

  private async requireManaged(actor: Actor, id: string): Promise<Product> {
    const product = await this.products.findById(id);

    if (product === undefined) {
      throw productNotFound();
    }

    await this.requireVendorAccess(actor, product.vendorId).catch(() => {
      throw productNotFound();
    });

    return product;
  }
}

function productNotFound(): NotFoundError {
  return new NotFoundError("Product not found");
}

function toSearch(
  query: Omit<SearchProductsQuery, "sort" | "category"> & {
    sort?: SearchProductsQuery["sort"];
    category?: SearchProductsQuery["category"];
  },
): ProductSearch {
  const sort = query.sort ?? (query.q === undefined ? "newest" : "relevance");

  return {
    q: query.q,
    categories: query.category === undefined ? undefined : expandCategory(query.category),
    minRating: query.minRating,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    inStock: query.inStock,
    sort,
    limit: query.limit,
    offset: query.offset,
  };
}
