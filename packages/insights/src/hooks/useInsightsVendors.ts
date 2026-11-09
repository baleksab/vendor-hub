import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listInsightsVendors } from "../api/insights";
import { insightsKeys, type VendorListParams } from "../api/queryKeys";
import { useApiClient } from "../context/ApiContext";

export function useInsightsVendors(params: VendorListParams) {
  const client = useApiClient();

  return useQuery({
    queryKey: insightsKeys.list(params),
    queryFn: () => listInsightsVendors(client, params),
    placeholderData: keepPreviousData,
  });
}
