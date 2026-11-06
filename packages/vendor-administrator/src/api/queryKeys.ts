import type { ManagedVendorListQuery } from "@vendor-hub/types";

export type VendorListParams = Required<Pick<ManagedVendorListQuery, "limit" | "offset">> &
  Omit<ManagedVendorListQuery, "limit" | "offset">;

export const vendorKeys = {
  all: ["vendors"] as const,
  lists: () => [...vendorKeys.all, "list"] as const,
  list: (params: VendorListParams) => [...vendorKeys.lists(), params] as const,
  details: () => [...vendorKeys.all, "detail"] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
};

export type ProductListParams = {
  q?: string;
  category?: string;
  inStock?: boolean;
  sort?: string;
  limit: number;
  offset: number;
};

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (slug: string, params: ProductListParams) =>
    [...productKeys.lists(), slug, params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  reviews: (id: string) => [...productKeys.all, "reviews", id] as const,
};

export const categoryKeys = {
  all: ["categories"] as const,
};
