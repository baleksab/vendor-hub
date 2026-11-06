import { unwrap } from "@vendor-hub/api-client";
import type {
  ManagedVendorListResponse,
  UpdateVendorRequest,
  VendorResponse,
} from "@vendor-hub/types";

import type { ApiClient } from "./client";
import type { VendorListParams } from "./queryKeys";

export function listManagedVendors(
  client: ApiClient,
  params: VendorListParams,
): Promise<ManagedVendorListResponse> {
  return unwrap(client.GET("/api/v1/vendors/managed", { params: { query: params } }));
}

export function getVendor(client: ApiClient, id: string): Promise<VendorResponse> {
  return unwrap(client.GET("/api/v1/vendors/{id}", { params: { path: { id } } }));
}

export function updateVendor(
  client: ApiClient,
  id: string,
  body: UpdateVendorRequest,
): Promise<VendorResponse> {
  return unwrap(client.PATCH("/api/v1/vendors/{id}", { params: { path: { id } }, body }));
}

export async function deleteVendor(client: ApiClient, id: string): Promise<void> {
  await unwrap(client.DELETE("/api/v1/vendors/{id}", { params: { path: { id } } }));
}

export function addOperator(client: ApiClient, id: string, email: string): Promise<VendorResponse> {
  return unwrap(
    client.POST("/api/v1/vendors/{id}/operators", { params: { path: { id } }, body: { email } }),
  );
}

export async function removeOperator(client: ApiClient, id: string, userId: string): Promise<void> {
  await unwrap(
    client.DELETE("/api/v1/vendors/{id}/operators/{userId}", {
      params: { path: { id, userId } },
    }),
  );
}
