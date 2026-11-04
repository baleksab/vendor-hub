import { createContext, use, useMemo, type ReactNode } from "react";

import { createT, type T } from "./index";
import type { Locale } from "./locales";

type I18n = { locale: Locale; t: T };

const I18nContext = createContext<I18n | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: createT(locale) }), [locale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}

function useI18n(): I18n {
  const value = use(I18nContext);

  if (!value) {
    throw new Error("useT and useLocale must be used inside LocaleProvider");
  }

  return value;
}

export function useT(): T {
  return useI18n().t;
}

export function useLocale(): Locale {
  return useI18n().locale;
}
