import { z } from "zod";

export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

function blankToNull(value: string): string | null {
  return value === "" ? null : value;
}

export const seoTitle = z.string().trim().max(SEO_TITLE_MAX).transform(blankToNull).nullable();

export const seoDescription = z
  .string()
  .trim()
  .max(SEO_DESCRIPTION_MAX)
  .transform(blankToNull)
  .nullable();
