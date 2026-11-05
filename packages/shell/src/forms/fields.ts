import { z } from "zod";

import type { MessageKey } from "../i18n";

const EMAIL_MAX = 254;

export const message = (key: MessageKey) => ({ error: key });

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, message("validation.required"))
  .max(EMAIL_MAX, message("validation.tooLong"))
  .pipe(z.email(message("validation.email")));
