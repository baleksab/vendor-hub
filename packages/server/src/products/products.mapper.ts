import { parentCategoryOf } from "../categories/categories.ts";
import type { Product, ProductImage, ProductListItem } from "./product.ts";

export function toImageResponse(image: ProductImage) {
  return {
    id: image.id,
    position: image.position,
    contentType: image.contentType,
    byteSize: image.byteSize,
  };
}

export function toProductResponse(product: Product) {
  return {
    id: product.id,
    vendorId: product.vendorId,
    vendorSlug: product.vendorSlug,
    vendorName: product.vendorName,
    category: product.category,
    parentCategory: parentCategoryOf(product.category),
    name: product.name,
    description: product.description,
    priceMinor: product.priceMinor,
    currency: product.currency,
    stock: product.stock,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    images: product.images.map(toImageResponse),
    createdAt: product.createdAt.toISOString(),
  };
}

export function toProductListItemResponse(item: ProductListItem) {
  return { ...item, createdAt: item.createdAt.toISOString() };
}
