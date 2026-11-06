import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProductRequest } from "@vendor-hub/types";

import { productKeys } from "../api/queryKeys";
import { createProduct } from "../api/products";
import { useApiClient } from "../context/ApiContext";

export function useCreateProduct(vendorId: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateProductRequest) => createProduct(client, vendorId, body),
    onSuccess: async (created) => {
      queryClient.setQueryData(productKeys.detail(created.id), created);
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
