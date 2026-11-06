import { z } from "zod";

import type { CreateUserRequest } from "@vendor-hub/types";
import type { MessageKey } from "../../i18n";
import { address, country, email, message, name, phoneNumber } from "../../forms/fields";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

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
      address,
      phoneNumber,
      country: country(countries),
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
