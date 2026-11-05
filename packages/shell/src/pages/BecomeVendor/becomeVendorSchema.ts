import { z } from "zod";

import { message } from "../../forms/fields";

const SLUG_MIN = 3;
const SLUG_MAX = 40;
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NAME_MIN = 2;
const NAME_MAX = 80;
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 1000;

export const becomeVendorSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(SLUG_MIN, message("validation.slug"))
    .max(SLUG_MAX, message("validation.slug"))
    .regex(SLUG_PATTERN, message("validation.slug")),
  name: z
    .string()
    .trim()
    .min(NAME_MIN, message("validation.tooShort"))
    .max(NAME_MAX, message("validation.tooLong")),
  description: z
    .string()
    .trim()
    .min(DESCRIPTION_MIN, message("validation.tooShort"))
    .max(DESCRIPTION_MAX, message("validation.tooLong")),
});
