import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateProductRequest } from "@vendor-hub/types";

import { productKeys } from "../api/queryKeys";
import { updateProduct } from "../api/products";
import { useApiClient } from "../context/ApiContext";

export function useUpdateProduct(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateProductRequest) => updateProduct(client, id, body),
    onSuccess: async (updated) => {
      queryClient.setQueryData(productKeys.detail(id), updated);
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
