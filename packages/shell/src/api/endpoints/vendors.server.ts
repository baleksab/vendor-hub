import type {
  AddOperatorRequest,
  MyVendorsResponse,
  PublicVendorResponse,
  RegisterVendorRequest,
  VendorResponse,
} from "@vendor-hub/types";
import { unwrap } from "../createApiClient";
import { createServerApi } from "../createServerApi.server";

export function registerVendor(
  token: string,
  body: RegisterVendorRequest,
): Promise<VendorResponse> {
  return unwrap(createServerApi(token).POST("/api/v1/vendors", { body }));
}

export function getMyVendors(token: string): Promise<MyVendorsResponse> {
  return unwrap(createServerApi(token).GET("/api/v1/vendors/me"));
}

export function addOperator(token: string, body: AddOperatorRequest): Promise<VendorResponse> {
  return unwrap(createServerApi(token).POST("/api/v1/vendors/me/operators", { body }));
}

export async function removeOperator(token: string, userId: string): Promise<void> {
  await unwrap(
    createServerApi(token).DELETE("/api/v1/vendors/me/operators/{userId}", {
      params: { path: { userId } },
    }),
  );
}

export function getVendorBySlug(slug: string): Promise<PublicVendorResponse> {
  return unwrap(
    createServerApi().GET("/api/v1/vendors/by-slug/{slug}", { params: { path: { slug } } }),
  );
}
