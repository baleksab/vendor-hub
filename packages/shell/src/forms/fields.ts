import { z } from "zod";

import type { MessageKey } from "../i18n";

const EMAIL_MAX = 254;
const NAME_MAX = 100;
const ADDRESS_MAX = 255;
const PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;

export const message = (key: MessageKey) => ({ error: key });

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, message("validation.required"))
  .max(EMAIL_MAX, message("validation.tooLong"))
  .pipe(z.email(message("validation.email")));

export const name = z
  .string()
  .trim()
  .min(1, message("validation.required"))
  .max(NAME_MAX, message("validation.tooLong"));

export const address = z
  .string()
  .trim()
  .min(1, message("validation.required"))
  .max(ADDRESS_MAX, message("validation.tooLong"));

export const phoneNumber = z.string().trim().regex(PHONE_PATTERN, message("validation.phone"));

export function country(countries: readonly string[]) {
  return z
    .string()
    .min(1, message("validation.required"))
    .refine((code) => countries.includes(code), message("validation.country"));
}
