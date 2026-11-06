import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { productKeys, type ProductListParams } from "../api/queryKeys";
import { searchProducts } from "../api/products";
import { useApiClient } from "../context/ApiContext";

export function useProducts(slug: string | undefined, params: ProductListParams) {
  const client = useApiClient();

  return useQuery({
    queryKey: productKeys.list(slug ?? "", params),
    queryFn: () => searchProducts(client, slug ?? "", params),
    enabled: slug !== undefined,
    placeholderData: keepPreviousData,
  });
}
