import { z } from "zod";

import { COUNTRY_CODES } from "../shared/countries.ts";
import { PageMeta, PaginationQuery } from "../shared/pagination.ts";
import { UserRoleSchema } from "./user-role.ts";

export const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const firstName = z.string().trim().min(1).max(100);
export const lastName = z.string().trim().min(1).max(100);
export const address = z.string().trim().min(1).max(255);
export const phoneNumber = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Must be in E.164 format, e.g. +381601234567");
export const country = z.enum(COUNTRY_CODES);
const password = z.string().min(8).max(128);

export const CreateUserRequest = z
  .object({
    email,
    password,
    firstName,
    lastName,
    address,
    phoneNumber,
    country,
  })
  .meta({ id: "CreateUserRequest" });

export const UpdateUserRequest = z
  .object({
    email: email.optional(),
    password: password.optional(),
    firstName: firstName.optional(),
    lastName: lastName.optional(),
    address: address.optional(),
    phoneNumber: phoneNumber.optional(),
    country: country.optional(),
    role: UserRoleSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "At least one field must be present",
  })
  .meta({ id: "UpdateUserRequest" });

export const UserResponse = z
  .object({
    id: z.uuid(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    address: z.string(),
    phoneNumber: z.string(),
    country: z.string(),
    role: UserRoleSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "UserResponse" });

export const UserListResponse = z
  .object({
    data: z.array(UserResponse),
    meta: PageMeta,
  })
  .meta({ id: "UserListResponse" });

const SEARCH_MAX_LENGTH = 100;

export const USER_SORT_FIELDS = ["name", "role", "country", "createdAt"] as const;

export const ListUsersQuery = PaginationQuery.extend({
  search: z.string().trim().min(1).max(SEARCH_MAX_LENGTH).optional(),
  role: UserRoleSchema.optional(),
  country: country.optional(),
  sort: z.enum(USER_SORT_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ListUsersQuery = z.infer<typeof ListUsersQuery>;

export function resolveUserOrder(query: ListUsersQuery): "asc" | "desc" {
  return query.order ?? (query.sort === "createdAt" ? "desc" : "asc");
}

export const UserIdParams = z.object({ id: z.uuid() });

export type CreateUserRequest = z.infer<typeof CreateUserRequest>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequest>;
export type UserResponse = z.infer<typeof UserResponse>;
export type UserListResponse = z.infer<typeof UserListResponse>;
