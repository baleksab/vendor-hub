import { z } from "zod";

import { FilterCategorySchema } from "../categories/categories.ts";
import { PageMeta, PaginationQuery } from "../shared/pagination.ts";
import { RESERVED_SLUGS } from "./reserved-slugs.ts";
import { VENDOR_MEMBER_ROLES, VendorMemberRoleSchema } from "./vendor-member-role.ts";

const slug = z
  .string()
  .min(3)
  .max(40)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Must use lowercase letters, digits and single hyphens, without a leading or trailing hyphen",
  )
  .refine((value) => !RESERVED_SLUGS.has(value), { message: "This slug is reserved" });
const name = z.string().trim().min(2).max(80);
const description = z.string().trim().min(10).max(1000);

export const RegisterVendorRequest = z
  .object({ slug, name, description })
  .meta({ id: "RegisterVendorRequest" });

export const AddOperatorRequest = z
  .object({ email: z.string().trim().toLowerCase().pipe(z.email().max(254)) })
  .meta({ id: "AddOperatorRequest" });

export const VendorMemberResponse = z
  .object({
    userId: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    role: VendorMemberRoleSchema,
  })
  .meta({ id: "VendorMemberResponse" });

export const ViewerRoleSchema = z.enum(["administrator", ...VENDOR_MEMBER_ROLES]);

export const UpdateVendorRequest = z
  .object({ name: name.optional(), description: description.optional() })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "At least one field must be present",
  })
  .meta({ id: "UpdateVendorRequest" });

export const VendorResponse = z
  .object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    members: z.array(VendorMemberResponse),
    viewerRole: ViewerRoleSchema,
    memberRole: VendorMemberRoleSchema.nullable(),
    canDelete: z.boolean(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: "VendorResponse" });

export const VendorSummaryResponse = z
  .object({ slug: z.string(), name: z.string() })
  .meta({ id: "VendorSummaryResponse" });

export const MyVendorsResponse = z
  .object({
    owned: VendorResponse.nullable(),
    operating: z.array(VendorSummaryResponse),
  })
  .meta({ id: "MyVendorsResponse" });

export const PublicVendorMemberResponse = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    role: VendorMemberRoleSchema,
  })
  .meta({ id: "PublicVendorMemberResponse" });

export const PublicVendorResponse = z
  .object({
    id: z.uuid(),
    ratingAvg: z.number(),
    ratingCount: z.number().int(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    members: z.array(PublicVendorMemberResponse),
  })
  .meta({ id: "PublicVendorResponse" });

export const VendorListItemResponse = z
  .object({
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    ratingAvg: z.number(),
    ratingCount: z.number().int(),
    productCount: z.number().int(),
    categories: z.array(z.string()),
  })
  .meta({ id: "VendorListItemResponse" });

export const VendorListResponse = z
  .object({ data: z.array(VendorListItemResponse), meta: PageMeta })
  .meta({ id: "VendorListResponse" });

const SEARCH_MAX_LENGTH = 100;

export const PUBLIC_VENDOR_SORTS = ["newest", "name", "rating", "productCount"] as const;

export const ListVendorsQuery = PaginationQuery.extend({
  search: z.string().trim().min(1).max(SEARCH_MAX_LENGTH).optional(),
  category: FilterCategorySchema.optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(PUBLIC_VENDOR_SORTS).default("newest"),
});

export const VENDOR_SORT_FIELDS = ["name", "createdAt", "memberCount"] as const;

export const ManagedVendorOwnerResponse = z
  .object({ userId: z.uuid(), firstName: z.string(), lastName: z.string() })
  .meta({ id: "ManagedVendorOwnerResponse" });

export const ManagedVendorListItemResponse = z
  .object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    owner: ManagedVendorOwnerResponse,
    memberCount: z.number().int().min(1),
    viewerRole: ViewerRoleSchema,
    memberRole: VendorMemberRoleSchema.nullable(),
    canDelete: z.boolean(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: "ManagedVendorListItemResponse" });

export const ManagedVendorListResponse = z
  .object({
    data: z.array(ManagedVendorListItemResponse),
    meta: PageMeta,
    scope: z.enum(["all", "mine"]),
  })
  .meta({ id: "ManagedVendorListResponse" });

export const ListManagedVendorsQuery = PaginationQuery.extend({
  search: z.string().trim().min(1).max(SEARCH_MAX_LENGTH).optional(),
  relation: z.enum(["owned", "operated"]).optional(),
  sort: z.enum(VENDOR_SORT_FIELDS).default("name"),
  order: z.enum(["asc", "desc"]).optional(),
});

export const VendorIdParams = z.object({ id: z.uuid() });

export const VendorOperatorParams = z.object({ id: z.uuid(), userId: z.uuid() });

export const VendorSlugParams = z.object({ slug: z.string().min(1).max(63) });

export const OperatorParams = z.object({ userId: z.uuid() });

export type RegisterVendorRequest = z.infer<typeof RegisterVendorRequest>;
export type AddOperatorRequest = z.infer<typeof AddOperatorRequest>;
export type UpdateVendorRequest = z.infer<typeof UpdateVendorRequest>;
export type ListVendorsQuery = z.infer<typeof ListVendorsQuery>;
export type ListManagedVendorsQuery = z.infer<typeof ListManagedVendorsQuery>;
export type ManagedVendorListResponse = z.infer<typeof ManagedVendorListResponse>;
export type VendorResponse = z.infer<typeof VendorResponse>;
export type MyVendorsResponse = z.infer<typeof MyVendorsResponse>;
export type VendorListResponse = z.infer<typeof VendorListResponse>;
export type PublicVendorResponse = z.infer<typeof PublicVendorResponse>;

export function resolveOrder(query: ListManagedVendorsQuery): "asc" | "desc" {
  return query.order ?? (query.sort === "name" ? "asc" : "desc");
}
