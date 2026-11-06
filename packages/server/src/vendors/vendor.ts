import type { VendorMemberRole } from "./vendor-member-role.ts";

export type VendorMember = {
  userId: string;
  firstName: string;
  lastName: string;
  role: VendorMemberRole;
};

export type Vendor = {
  id: string;
  slug: string;
  name: string;
  description: string;
  members: VendorMember[];
  createdAt: Date;
};

export type VendorSummary = {
  slug: string;
  name: string;
};

export type NewVendor = {
  slug: string;
  name: string;
  description: string;
  ownerId: string;
};

export type VendorListItem = {
  slug: string;
  name: string;
  description: string;
};

export type VendorPatch = {
  name?: string;
  description?: string;
};

export type VendorOwner = {
  userId: string;
  firstName: string;
  lastName: string;
};

export type ManagedVendorRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  owner: VendorOwner;
  memberCount: number;
  callerRole: VendorMemberRole | undefined;
  createdAt: Date;
};
