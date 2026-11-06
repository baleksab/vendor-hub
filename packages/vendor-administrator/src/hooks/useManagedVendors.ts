import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { vendorKeys, type VendorListParams } from "../api/queryKeys";
import { listManagedVendors } from "../api/vendors";
import { useApiClient } from "../context/ApiContext";

export function useManagedVendors(params: VendorListParams) {
  const client = useApiClient();

  return useQuery({
    queryKey: vendorKeys.list(params),
    queryFn: () => listManagedVendors(client, params),
    placeholderData: keepPreviousData,
  });
}
