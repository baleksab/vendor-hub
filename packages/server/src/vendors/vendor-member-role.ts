import { z } from "zod";

export const VENDOR_MEMBER_ROLES = ["owner", "operator"] as const;

export const VendorMemberRoleSchema = z.enum(VENDOR_MEMBER_ROLES);

export type VendorMemberRole = (typeof VENDOR_MEMBER_ROLES)[number];
