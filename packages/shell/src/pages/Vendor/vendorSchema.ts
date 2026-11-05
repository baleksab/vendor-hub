import { z } from "zod";

import { email } from "../../forms/fields";

export const addOperatorSchema = z.object({ email });

export const removeOperatorSchema = z.object({ userId: z.uuid() });
