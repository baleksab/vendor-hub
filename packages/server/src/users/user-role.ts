import { z } from "zod";

export const USER_ROLES = ["administrator", "regular"] as const;

export const UserRoleSchema = z.enum(USER_ROLES);

export type UserRole = (typeof USER_ROLES)[number];
