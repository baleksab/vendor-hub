import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { InsightsDetailQuery } from "@vendor-hub/types";

import { getProductInsights } from "../api/insights";
import { insightsKeys } from "../api/queryKeys";
import { useApiClient } from "../context/ApiContext";

export function useProductInsights(id: string, query: InsightsDetailQuery) {
  const client = useApiClient();

  return useQuery({
    queryKey: insightsKeys.product(id, query),
    queryFn: () => getProductInsights(client, id, query),
    placeholderData: keepPreviousData,
  });
}
