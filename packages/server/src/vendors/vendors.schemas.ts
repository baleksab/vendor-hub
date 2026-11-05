import { z } from "zod";

import { RESERVED_SLUGS } from "./reserved-slugs.ts";
import { VendorMemberRoleSchema } from "./vendor-member-role.ts";

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

export const VendorResponse = z
  .object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    members: z.array(VendorMemberResponse),
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
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    members: z.array(PublicVendorMemberResponse),
  })
  .meta({ id: "PublicVendorResponse" });

export const VendorSlugParams = z.object({ slug: z.string().min(1).max(63) });

export const OperatorParams = z.object({ userId: z.uuid() });

export type RegisterVendorRequest = z.infer<typeof RegisterVendorRequest>;
export type AddOperatorRequest = z.infer<typeof AddOperatorRequest>;
export type VendorResponse = z.infer<typeof VendorResponse>;
export type MyVendorsResponse = z.infer<typeof MyVendorsResponse>;
export type PublicVendorResponse = z.infer<typeof PublicVendorResponse>;
