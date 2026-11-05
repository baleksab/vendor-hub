import type { Locale } from "@vendor-hub/types";
import { createContext, use } from "react";

export const LocaleContext = createContext<Locale | null>(null);

export function useLocale(): Locale {
  const locale = use(LocaleContext);

  if (!locale) {
    throw new Error("useLocale must be used inside UserAdministrator");
  }

  return locale;
}
