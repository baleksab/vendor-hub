import type { CategoryResponse } from "@vendor-hub/types";

import type { Locale } from "../../i18n/locales";

export function categorySlugs(tree: CategoryResponse[]): Set<string> {
  return new Set(tree.flatMap((top) => [top.slug, ...top.children.map((child) => child.slug)]));
}

export function categoryName(tree: CategoryResponse[], slug: string, locale: Locale): string {
  for (const top of tree) {
    if (top.slug === slug) {
      return top.names[locale];
    }

    const child = top.children.find((candidate) => candidate.slug === slug);

    if (child !== undefined) {
      return child.names[locale];
    }
  }

  return slug;
}

export function categoryTrail(tree: CategoryResponse[], slug: string): { slug: string }[] {
  const parent = tree.find((top) => top.children.some((child) => child.slug === slug));

  return parent === undefined ? [{ slug }] : [{ slug: parent.slug }, { slug }];
}
