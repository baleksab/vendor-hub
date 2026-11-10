import { z } from "zod";

import { FilterCategorySchema, ProductCategorySchema } from "../categories/categories.ts";
import { PageMeta, PaginationQuery } from "../shared/pagination.ts";
import { seoDescription, seoTitle } from "../shared/seo.ts";
import { CURRENCIES } from "./currencies.ts";

export const PRODUCT_SORTS = [
  "relevance",
  "newest",
  "priceAsc",
  "priceDesc",
  "rating",
  "name",
] as const;

const MAX_PRICE_MINOR = 2_000_000_000;
export const MAX_STOCK = 1_000_000;
const SEARCH_MAX_LENGTH = 100;

const name = z.string().trim().min(2).max(120);
const description = z.string().trim().min(1).max(2000);
const priceMinor = z.number().int().min(0).max(MAX_PRICE_MINOR);
const currency = z.enum(CURRENCIES);
const stock = z.number().int().min(0).max(MAX_STOCK);

export const CreateProductRequest = z
  .object({
    name,
    description,
    category: ProductCategorySchema,
    priceMinor,
    currency,
    stock,
    seoTitle: seoTitle.optional(),
    seoDescription: seoDescription.optional(),
  })
  .meta({ id: "CreateProductRequest" });

export const UpdateProductRequest = z
  .object({
    name: name.optional(),
    description: description.optional(),
    category: ProductCategorySchema.optional(),
    priceMinor: priceMinor.optional(),
    currency: currency.optional(),
    stock: stock.optional(),
    seoTitle: seoTitle.optional(),
    seoDescription: seoDescription.optional(),
    seoImageId: z.uuid().nullable().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "At least one field must be present",
  })
  .meta({ id: "UpdateProductRequest" });

export const ProductImageResponse = z
  .object({
    id: z.uuid(),
    position: z.number().int().min(0),
    contentType: z.string(),
    byteSize: z.number().int(),
  })
  .meta({ id: "ProductImageResponse" });

export const ProductResponse = z
  .object({
    id: z.uuid(),
    vendorId: z.uuid(),
    vendorSlug: z.string(),
    vendorName: z.string(),
    category: z.string(),
    parentCategory: z.string().nullable(),
    name: z.string(),
    description: z.string(),
    priceMinor: z.number().int(),
    currency: z.enum(CURRENCIES),
    stock: z.number().int(),
    seoTitle: z.string().nullable(),
    seoDescription: z.string().nullable(),
    seoImageId: z.uuid().nullable(),
    ratingAvg: z.number(),
    ratingCount: z.number().int(),
    images: z.array(ProductImageResponse),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: "ProductResponse" });

export const ProductListItemResponse = z
  .object({
    id: z.uuid(),
    category: z.string(),
    name: z.string(),
    priceMinor: z.number().int(),
    currency: z.enum(CURRENCIES),
    stock: z.number().int(),
    ratingAvg: z.number(),
    ratingCount: z.number().int(),
    coverImageId: z.uuid().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: "ProductListItemResponse" });

export const ProductListResponse = z
  .object({ data: z.array(ProductListItemResponse), meta: PageMeta })
  .meta({ id: "ProductListResponse" });

export const ProductCategoryCountResponse = z
  .object({ category: z.string(), count: z.number().int().min(1) })
  .meta({ id: "ProductCategoryCountResponse" });

export const ProductCategoryCountListResponse = z
  .object({ data: z.array(ProductCategoryCountResponse) })
  .meta({ id: "ProductCategoryCountListResponse" });

const booleanFlag = z.enum(["true", "false"]).transform((value) => value === "true");

const ProductFilters = z.object({
  q: z.string().trim().min(1).max(SEARCH_MAX_LENGTH).optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  minPrice: z.coerce.number().int().min(0).max(MAX_PRICE_MINOR).optional(),
  maxPrice: z.coerce.number().int().min(0).max(MAX_PRICE_MINOR).optional(),
  inStock: booleanFlag.optional(),
});

export const SearchProductsQuery = PaginationQuery.extend({
  ...ProductFilters.shape,
  category: FilterCategorySchema.optional(),
  sort: z.enum(PRODUCT_SORTS).optional(),
});

export const ProductCategoryCountsQuery = ProductFilters;

export const ProductIdParams = z.object({ id: z.uuid() });

export const VendorProductsParams = z.object({ id: z.uuid() });

export const ProductImageParams = z.object({ id: z.uuid(), imageId: z.uuid() });

export const ReorderImagesRequest = z
  .object({ imageIds: z.array(z.uuid()) })
  .meta({ id: "ReorderImagesRequest" });

export type CreateProductRequest = z.infer<typeof CreateProductRequest>;
export type UpdateProductRequest = z.infer<typeof UpdateProductRequest>;
export type SearchProductsQuery = z.infer<typeof SearchProductsQuery>;
export type ProductCategoryCountsQuery = z.infer<typeof ProductCategoryCountsQuery>;
export type ReorderImagesRequest = z.infer<typeof ReorderImagesRequest>;
