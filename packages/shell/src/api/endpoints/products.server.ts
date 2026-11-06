import { unwrap } from "@vendor-hub/api-client";
import type {
  CategoryListResponse,
  paths,
  ProductCategoryCountListResponse,
  ProductListResponse,
  ProductResponse,
} from "@vendor-hub/types";
import { createServerApi } from "../createServerApi.server";

type SearchQuery = NonNullable<
  paths["/api/v1/vendors/by-slug/{slug}/products"]["get"]["parameters"]["query"]
>;

export type ProductSearchQuery = {
  q?: string;
  category?: SearchQuery["category"];
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: "true";
  sort?: "relevance" | "newest" | "priceAsc" | "priceDesc" | "rating" | "name";
  limit: number;
  offset: number;
};

export function listCategories(): Promise<CategoryListResponse> {
  return unwrap(createServerApi().GET("/api/v1/categories"));
}

export function searchProducts(
  slug: string,
  query: ProductSearchQuery,
): Promise<ProductListResponse> {
  return unwrap(
    createServerApi().GET("/api/v1/vendors/by-slug/{slug}/products", {
      params: { path: { slug }, query },
    }),
  );
}

export function listProductCategoryCounts(
  slug: string,
  query: Omit<ProductSearchQuery, "category" | "sort" | "limit" | "offset">,
): Promise<ProductCategoryCountListResponse> {
  return unwrap(
    createServerApi().GET("/api/v1/vendors/by-slug/{slug}/product-categories", {
      params: { path: { slug }, query },
    }),
  );
}

export function getProduct(id: string): Promise<ProductResponse> {
  return unwrap(createServerApi().GET("/api/v1/products/{id}", { params: { path: { id } } }));
}
