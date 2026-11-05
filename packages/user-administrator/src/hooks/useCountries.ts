import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { countryKeys } from "../api/queryKeys";
import { listCountries } from "../api/countries";
import { useApiClient } from "../context/ApiContext";
import { useLocale } from "../context/LocaleContext";
import { createCountryName } from "../i18n/countries";

export function useCountries() {
  const client = useApiClient();
  const locale = useLocale();

  const { data } = useQuery({
    queryKey: countryKeys.all,
    queryFn: () => listCountries(client),
    staleTime: Infinity,
  });

  return useMemo(() => {
    const countryName = createCountryName(locale);
    const options = (data ?? [])
      .map((code) => ({ value: code, label: countryName(code) }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));

    return { options, countryName };
  }, [data, locale]);
}
