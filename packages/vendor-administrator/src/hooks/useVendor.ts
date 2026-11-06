import { useQuery } from "@tanstack/react-query";

import { vendorKeys } from "../api/queryKeys";
import { getVendor } from "../api/vendors";
import { useApiClient } from "../context/ApiContext";

export function useVendor(id: string) {
  const client = useApiClient();

  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => getVendor(client, id),
  });
}
