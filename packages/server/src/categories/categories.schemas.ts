import { z } from "zod";

const CategoryNamesResponse = z
  .object({ en: z.string(), sr: z.string() })
  .meta({ id: "CategoryNamesResponse" });

export const ChildCategoryResponse = z
  .object({ slug: z.string(), names: CategoryNamesResponse })
  .meta({ id: "ChildCategoryResponse" });

export const CategoryResponse = z
  .object({
    slug: z.string(),
    names: CategoryNamesResponse,
    children: z.array(ChildCategoryResponse),
  })
  .meta({ id: "CategoryResponse" });

export const CategoryListResponse = z
  .object({ data: z.array(CategoryResponse) })
  .meta({ id: "CategoryListResponse" });
