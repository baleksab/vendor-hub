import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { InsightsDetailQuery } from "@vendor-hub/types";

import { getVendorInsights } from "../api/insights";
import { insightsKeys } from "../api/queryKeys";
import { useApiClient } from "../context/ApiContext";

export function useVendorInsights(id: string, query: InsightsDetailQuery) {
  const client = useApiClient();

  return useQuery({
    queryKey: insightsKeys.vendor(id, query),
    queryFn: () => getVendorInsights(client, id, query),
    placeholderData: keepPreviousData,
  });
}
