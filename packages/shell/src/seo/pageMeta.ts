import type { MetaDescriptor } from "react-router";

import { createT } from "../i18n";
import type { PlainMessageKey } from "../i18n";
import { isLocale } from "../i18n/locales";
import { createPageMeta } from "./createMeta";

type RootMatch = { id: string; loaderData: unknown } | undefined;

type PageMetaOptions = {
  titleKey: PlainMessageKey;
  descriptionKey: PlainMessageKey;
  path: string;
  noindex?: boolean;
};

export function readRootData(matches: ReadonlyArray<RootMatch>) {
  const data = matches.find((match) => match?.id === "root")?.loaderData;

  if (typeof data !== "object" || data === null) {
    return null;
  }

  const { locale, origin } = data as { locale?: unknown; origin?: unknown };

  if (!isLocale(locale) || typeof origin !== "string") {
    return null;
  }

  return { locale, origin };
}

export function pageMeta(
  matches: ReadonlyArray<RootMatch>,
  options: PageMetaOptions,
): MetaDescriptor[] {
  const root = readRootData(matches);

  if (!root) {
    return [];
  }

  const t = createT(root.locale);

  return createPageMeta({
    title: t(options.titleKey),
    description: t(options.descriptionKey),
    path: options.path,
    origin: root.origin,
    locale: root.locale,
    siteName: t("app.title"),
    noindex: options.noindex,
  });
}
