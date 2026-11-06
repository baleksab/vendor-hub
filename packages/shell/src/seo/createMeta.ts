import type { MetaDescriptor } from "react-router";

import type { Locale } from "../i18n/locales";

const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  sr: "sr_RS",
};

export type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  origin: string;
  locale: Locale;
  siteName: string;
  noindex?: boolean;
  image?: string;
};

export function createPageMeta(input: PageMetaInput): MetaDescriptor[] {
  const url = new URL(input.path, input.origin).toString();

  const meta: MetaDescriptor[] = [
    { title: input.title },
    { name: "description", content: input.description },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: input.siteName },
    { property: "og:locale", content: OG_LOCALES[input.locale] },
    {
      name: "twitter:card",
      content: input.image === undefined ? "summary" : "summary_large_image",
    },
  ];

  if (input.image !== undefined) {
    meta.push({ property: "og:image", content: new URL(input.image, input.origin).toString() });
  }

  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex" });
  } else {
    meta.push({ tagName: "link", rel: "canonical", href: url });
  }

  return meta;
}
