import { unwrap } from "@vendor-hub/api-client";
import type {
  CategoryListResponse,
  CreateProductRequest,
  ProductImageResponse,
  ProductListResponse,
  ProductResponse,
  ReviewListResponse,
  UpdateProductRequest,
} from "@vendor-hub/types";

import type { ApiClient } from "./client";
import type { ProductListParams } from "./queryKeys";

type SortParam = "relevance" | "newest" | "priceAsc" | "priceDesc" | "rating" | "name";

export function listCategories(client: ApiClient): Promise<CategoryListResponse> {
  return unwrap(client.GET("/api/v1/categories"));
}

export function searchProducts(
  client: ApiClient,
  slug: string,
  params: ProductListParams,
): Promise<ProductListResponse> {
  const { category, sort, inStock, ...rest } = params;

  return unwrap(
    client.GET("/api/v1/vendors/by-slug/{slug}/products", {
      params: {
        path: { slug },
        query: {
          ...rest,
          ...(category === undefined ? {} : { category: category as never }),
          ...(sort === undefined ? {} : { sort: sort as SortParam }),
          ...(inStock === true ? { inStock: "true" as const } : {}),
        },
      },
    }),
  );
}

export function getProduct(client: ApiClient, id: string): Promise<ProductResponse> {
  return unwrap(client.GET("/api/v1/products/{id}", { params: { path: { id } } }));
}

export function createProduct(
  client: ApiClient,
  vendorId: string,
  body: CreateProductRequest,
): Promise<ProductResponse> {
  return unwrap(
    client.POST("/api/v1/vendors/{id}/products", { params: { path: { id: vendorId } }, body }),
  );
}

export function updateProduct(
  client: ApiClient,
  id: string,
  body: UpdateProductRequest,
): Promise<ProductResponse> {
  return unwrap(client.PATCH("/api/v1/products/{id}", { params: { path: { id } }, body }));
}

export async function deleteProduct(client: ApiClient, id: string): Promise<void> {
  await unwrap(client.DELETE("/api/v1/products/{id}", { params: { path: { id } } }));
}

export function uploadProductImage(
  client: ApiClient,
  id: string,
  file: File,
): Promise<ProductImageResponse> {
  const body = new FormData();

  body.append("file", file);

  return unwrap(
    client.POST("/api/v1/products/{id}/images", {
      params: { path: { id } },
      body: body as never,
      bodySerializer: (value: unknown) => value as FormData,
    }),
  );
}

export function reorderProductImages(
  client: ApiClient,
  id: string,
  imageIds: string[],
): Promise<ProductResponse> {
  return unwrap(
    client.PUT("/api/v1/products/{id}/images/order", {
      params: { path: { id } },
      body: { imageIds },
    }),
  );
}

export async function deleteProductImage(
  client: ApiClient,
  id: string,
  imageId: string,
): Promise<void> {
  await unwrap(
    client.DELETE("/api/v1/products/{id}/images/{imageId}", { params: { path: { id, imageId } } }),
  );
}

export function listProductReviews(client: ApiClient, id: string): Promise<ReviewListResponse> {
  return unwrap(
    client.GET("/api/v1/products/{id}/reviews", {
      params: { path: { id }, query: { limit: 50, offset: 0 } },
    }),
  );
}

export async function deleteProductReview(
  client: ApiClient,
  id: string,
  reviewId: string,
): Promise<void> {
  await unwrap(
    client.DELETE("/api/v1/products/{id}/reviews/{reviewId}", {
      params: { path: { id, reviewId } },
    }),
  );
}
