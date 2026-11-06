import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listVendorOrders } from "../api/orders";
import { orderKeys, type OrderListParams } from "../api/queryKeys";
import { useApiClient } from "../context/ApiContext";

export function useVendorOrders(vendorId: string, params: OrderListParams) {
  const client = useApiClient();

  return useQuery({
    queryKey: orderKeys.list(vendorId, params),
    queryFn: () => listVendorOrders(client, vendorId, params),
    placeholderData: keepPreviousData,
  });
}
