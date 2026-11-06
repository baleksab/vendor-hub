import { useMemo } from "react";

import { useLocale } from "../../i18n/LocaleProvider";

export function useCountryOptions(countries: string[] | null) {
  const locale = useLocale();

  return useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });

    return (countries ?? [])
      .map((code) => ({ value: code, label: names.of(code) ?? code }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [countries, locale]);
}
