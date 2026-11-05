import { z } from "zod";

import type { LoginRequest } from "@vendor-hub/types";
import { email, message } from "../../forms/fields";

export const loginSchema = z.object({
  email,
  password: z.string().min(1, message("validation.required")),
}) satisfies z.ZodType<LoginRequest, unknown>;
