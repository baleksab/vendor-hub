import type { CategoryResponse, Locale } from "@vendor-hub/types";

type Group = { group: string; items: { value: string; label: string }[] };

export function leafCategoryGroups(tree: CategoryResponse[], locale: Locale): Group[] {
  return tree.map((top) => ({
    group: top.names[locale],
    items:
      top.children.length === 0
        ? [{ value: top.slug, label: top.names[locale] }]
        : top.children.map((child) => ({ value: child.slug, label: child.names[locale] })),
  }));
}

export function categoryLabel(tree: CategoryResponse[], slug: string, locale: Locale): string {
  for (const top of tree) {
    if (top.slug === slug) return top.names[locale];

    const child = top.children.find((candidate) => candidate.slug === slug);

    if (child !== undefined) return child.names[locale];
  }

  return slug;
}
