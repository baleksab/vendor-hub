import type {
  VendorListResponse,
  MyVendorsResponse,
  PublicVendorResponse,
  RegisterVendorRequest,
  VendorResponse,
} from "@vendor-hub/types";
import { unwrap } from "@vendor-hub/api-client";
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

export function listVendors(query: { limit: number; offset: number }): Promise<VendorListResponse> {
  return unwrap(createServerApi().GET("/api/v1/vendors", { params: { query } }));
}

export function getVendorBySlug(slug: string): Promise<PublicVendorResponse> {
  return unwrap(
    createServerApi().GET("/api/v1/vendors/by-slug/{slug}", { params: { path: { slug } } }),
  );
}
