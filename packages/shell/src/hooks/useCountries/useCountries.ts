import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../api/queryKeys";
import type { CountryListResponse } from "../../api/types";
import { useBrowserClients } from "../../providers/QueryProvider";

export function useCountries(initialData: string[] | null) {
  const { api } = useBrowserClients();

  return useQuery({
    queryKey: queryKeys.countries.list(),
    initialData: initialData ?? undefined,
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await api.get<CountryListResponse>("/countries");

      return data.data;
    },
  });
}
