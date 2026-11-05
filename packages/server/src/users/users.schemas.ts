import { z } from "zod";

import { COUNTRY_CODES } from "../shared/countries.ts";
import { PageMeta, PaginationQuery } from "../shared/pagination.ts";
import { UserRoleSchema } from "./user-role.ts";

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const firstName = z.string().trim().min(1).max(100);
const lastName = z.string().trim().min(1).max(100);
const address = z.string().trim().min(1).max(255);
const phoneNumber = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, "Must be in E.164 format, e.g. +381601234567");
const country = z.enum(COUNTRY_CODES);
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

export const ListUsersQuery = PaginationQuery;

export const UserIdParams = z.object({ id: z.uuid() });

export type CreateUserRequest = z.infer<typeof CreateUserRequest>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequest>;
export type UserResponse = z.infer<typeof UserResponse>;
export type UserListResponse = z.infer<typeof UserListResponse>;
