import { useQuery } from "@tanstack/react-query";

import { getOrder } from "../api/orders";
import { orderKeys } from "../api/queryKeys";
import { useApiClient } from "../context/ApiContext";

export function useOrder(id: string) {
  const client = useApiClient();

  return useQuery({ queryKey: orderKeys.detail(id), queryFn: () => getOrder(client, id) });
}
