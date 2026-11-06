import { useMutation, useQueryClient } from "@tanstack/react-query";

import { productKeys } from "../api/queryKeys";
import { deleteProduct } from "../api/products";
import { useApiClient } from "../context/ApiContext";

export function useDeleteProduct() {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(client, id),
    onSuccess: async (_result, id) => {
      queryClient.removeQueries({ queryKey: productKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
