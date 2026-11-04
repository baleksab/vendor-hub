import { z } from "zod";

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
});

export const PageMeta = z.object({
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});

export type Page = z.infer<typeof PaginationQuery>;
