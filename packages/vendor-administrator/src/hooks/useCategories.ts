import { useQuery } from "@tanstack/react-query";

import { categoryKeys } from "../api/queryKeys";
import { listCategories } from "../api/products";
import { useApiClient } from "../context/ApiContext";

export function useCategories() {
  const client = useApiClient();

  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: () => listCategories(client),
    staleTime: Infinity,
  });
}
