import { z } from "zod";

import type { CreateUserRequest } from "@vendor-hub/types";
import type { MessageKey } from "../../i18n";
import { email, message } from "../../forms/fields";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const NAME_MAX = 100;
const ADDRESS_MAX = 255;
const PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;

const name = z
  .string()
  .trim()
  .min(1, message("validation.required"))
  .max(NAME_MAX, message("validation.tooLong"));

export function createRegisterSchema(countries: readonly string[]) {
  return z
    .object({
      email,
      password: z
        .string()
        .min(PASSWORD_MIN, message("validation.password.min"))
        .max(PASSWORD_MAX, message("validation.password.max")),
      confirmPassword: z.string().min(1, message("validation.required")),
      firstName: name,
      lastName: name,
      address: z
        .string()
        .trim()
        .min(1, message("validation.required"))
        .max(ADDRESS_MAX, message("validation.tooLong")),
      phoneNumber: z.string().trim().regex(PHONE_PATTERN, message("validation.phone")),
      country: z
        .string()
        .min(1, message("validation.required"))
        .refine((code) => countries.includes(code), message("validation.country")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      error: "validation.passwordMismatch" satisfies MessageKey,
    });
}

export type RegisterValues = z.output<ReturnType<typeof createRegisterSchema>>;

export function toCreateUserRequest(values: RegisterValues): CreateUserRequest {
  return {
    email: values.email,
    password: values.password,
    firstName: values.firstName,
    lastName: values.lastName,
    address: values.address,
    phoneNumber: values.phoneNumber,
    country: values.country as CreateUserRequest["country"],
  };
}
