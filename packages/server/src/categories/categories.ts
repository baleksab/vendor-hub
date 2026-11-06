import { z } from "zod";

export type CategoryNames = { en: string; sr: string };

export type CategoryNode = {
  slug: string;
  names: CategoryNames;
  children: CategoryNode[];
};

function leaf(slug: string, en: string, sr: string): CategoryNode {
  return { slug, names: { en, sr }, children: [] };
}

function group(slug: string, en: string, sr: string, children: CategoryNode[]): CategoryNode {
  return { slug, names: { en, sr }, children };
}

export const CATEGORY_TREE: readonly CategoryNode[] = [
  group("electronics", "Electronics", "Elektronika", [
    leaf("phones", "Phones", "Telefoni"),
    leaf("computers", "Computers", "Računari"),
    leaf("tv-audio", "TV and audio", "TV i audio"),
    leaf("appliances", "Appliances", "Bela tehnika"),
  ]),
  group("home-garden", "Home and garden", "Kuća i bašta", [
    leaf("furniture", "Furniture", "Nameštaj"),
    leaf("tools", "Tools", "Alati"),
    leaf("garden", "Garden", "Bašta"),
  ]),
  group("fashion", "Fashion", "Moda", [
    leaf("clothing", "Clothing", "Odeća"),
    leaf("shoes", "Shoes", "Obuća"),
    leaf("accessories", "Accessories", "Dodaci"),
  ]),
  group("sports-leisure", "Sports and leisure", "Sport i rekreacija", [
    leaf("fitness", "Fitness", "Fitnes"),
    leaf("outdoor", "Outdoor", "Priroda i kampovanje"),
    leaf("books-media", "Books and media", "Knjige i mediji"),
  ]),
  group("auto", "Auto", "Auto", [
    leaf("car-parts", "Car parts", "Auto delovi"),
    leaf("car-accessories", "Car accessories", "Auto oprema"),
  ]),
  leaf("other", "Other", "Ostalo"),
];

type Entry = { node: CategoryNode; parent: CategoryNode | undefined };

const ENTRIES = new Map<string, Entry>();

for (const top of CATEGORY_TREE) {
  ENTRIES.set(top.slug, { node: top, parent: undefined });

  for (const child of top.children) {
    ENTRIES.set(child.slug, { node: child, parent: top });
  }
}

export const ALL_CATEGORY_SLUGS = [...ENTRIES.keys()] as [string, ...string[]];

export const PRODUCT_CATEGORY_SLUGS = [...ENTRIES.values()]
  .filter((entry) => entry.node.children.length === 0)
  .map((entry) => entry.node.slug) as [string, ...string[]];

export const ProductCategorySchema = z.enum(PRODUCT_CATEGORY_SLUGS);

export const FilterCategorySchema = z.enum(ALL_CATEGORY_SLUGS);

export function parentCategoryOf(slug: string): string | null {
  return ENTRIES.get(slug)?.parent?.slug ?? null;
}

export function expandCategory(slug: string): string[] {
  const node = ENTRIES.get(slug)?.node;

  if (node === undefined) {
    return [];
  }

  return node.children.length === 0 ? [slug] : node.children.map((child) => child.slug);
}
