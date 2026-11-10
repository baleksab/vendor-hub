import type { Currency } from "./currencies.ts";

export type ProductImage = {
  id: string;
  productId: string;
  position: number;
  contentType: string;
  byteSize: number;
};

export type Product = {
  id: string;
  vendorId: string;
  vendorSlug: string;
  vendorName: string;
  category: string;
  name: string;
  description: string;
  priceMinor: number;
  currency: Currency;
  stock: number;
  seoTitle: string | null;
  seoDescription: string | null;
  seoImageId: string | null;
  ratingAvg: number;
  ratingCount: number;
  images: ProductImage[];
  createdAt: Date;
};

export type ProductListItem = {
  id: string;
  category: string;
  name: string;
  priceMinor: number;
  currency: Currency;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  coverImageId: string | null;
  createdAt: Date;
};

export type NewProduct = {
  vendorId: string;
  category: string;
  name: string;
  description: string;
  priceMinor: number;
  currency: Currency;
  stock: number;
  seoTitle?: string | null | undefined;
  seoDescription?: string | null | undefined;
};

export type ProductPatch = Partial<Omit<NewProduct, "vendorId">> & {
  seoImageId?: string | null;
};

export type ProductSort = "relevance" | "newest" | "priceAsc" | "priceDesc" | "rating" | "name";

export type ProductSearch = {
  q?: string | undefined;
  categories?: string[] | undefined;
  minRating?: number | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  inStock?: boolean | undefined;
  sort: ProductSort;
  limit: number;
  offset: number;
};

export type CategoryCount = { category: string; count: number };

export type NewProductImage = { contentType: string; byteSize: number };

export type ProductSnapshot = {
  id: string;
  vendorId: string;
  vendorSlug: string;
  vendorName: string;
  name: string;
  priceMinor: number;
  currency: Currency;
  stock: number;
  coverImageId: string | null;
};
