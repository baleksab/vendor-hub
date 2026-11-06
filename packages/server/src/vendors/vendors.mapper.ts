import { OWNER_ACCESS, type VendorAccess } from "./vendor-access.ts";
import type { ManagedVendorRow, Vendor, VendorSummary } from "./vendor.ts";
import type {
  ManagedVendorListResponse,
  MyVendorsResponse,
  PublicVendorResponse,
  VendorResponse,
} from "./vendors.schemas.ts";

export function toVendorResponse(
  vendor: Vendor,
  access: VendorAccess = OWNER_ACCESS,
): VendorResponse {
  return {
    id: vendor.id,
    slug: vendor.slug,
    name: vendor.name,
    description: vendor.description,
    members: vendor.members.map((member) => ({ ...member })),
    viewerRole: access.viewerRole,
    memberRole: access.memberRole,
    canDelete: access.canDelete,
    createdAt: vendor.createdAt.toISOString(),
  };
}

export function toPublicVendorResponse(vendor: Vendor): PublicVendorResponse {
  return {
    id: vendor.id,
    ratingAvg: vendor.ratingAvg,
    ratingCount: vendor.ratingCount,
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

export function toManagedVendorListResponse(
  items: (ManagedVendorRow & VendorAccess)[],
  total: number,
  page: { limit: number; offset: number },
  scope: ManagedVendorListResponse["scope"],
): ManagedVendorListResponse {
  return {
    data: items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      owner: item.owner,
      memberCount: item.memberCount,
      viewerRole: item.viewerRole,
      memberRole: item.memberRole,
      canDelete: item.canDelete,
      createdAt: item.createdAt.toISOString(),
    })),
    meta: { total, limit: page.limit, offset: page.offset },
    scope,
  };
}
