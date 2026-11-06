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
