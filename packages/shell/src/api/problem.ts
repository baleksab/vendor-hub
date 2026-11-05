import { z } from "zod";

export const ProblemSchema = z.object({
  title: z.string(),
  status: z.number(),
  detail: z.string(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export type Problem = z.infer<typeof ProblemSchema>;
