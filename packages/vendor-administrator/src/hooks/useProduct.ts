import { useQuery } from "@tanstack/react-query";

import { productKeys } from "../api/queryKeys";
import { getProduct } from "../api/products";
import { useApiClient } from "../context/ApiContext";

export function useProduct(id: string | undefined) {
  const client = useApiClient();

  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => getProduct(client, id ?? ""),
    enabled: id !== undefined,
  });
}
