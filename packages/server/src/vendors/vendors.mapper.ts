import type { Vendor, VendorSummary } from "./vendor.ts";
import type { MyVendorsResponse, PublicVendorResponse, VendorResponse } from "./vendors.schemas.ts";

export function toVendorResponse(vendor: Vendor): VendorResponse {
  return {
    id: vendor.id,
    slug: vendor.slug,
    name: vendor.name,
    description: vendor.description,
    members: vendor.members.map((member) => ({ ...member })),
    createdAt: vendor.createdAt.toISOString(),
  };
}

export function toPublicVendorResponse(vendor: Vendor): PublicVendorResponse {
  return {
    slug: vendor.slug,
    name: vendor.name,
    description: vendor.description,
    members: vendor.members.map(({ firstName, lastName, role }) => ({
      firstName,
      lastName,
      role,
    })),
  };
}

export function toMyVendorsResponse(
  owned: Vendor | undefined,
  operating: VendorSummary[],
): MyVendorsResponse {
  return {
    owned: owned === undefined ? null : toVendorResponse(owned),
    operating,
  };
}
