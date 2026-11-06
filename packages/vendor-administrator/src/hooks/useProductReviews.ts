import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { productKeys } from "../api/queryKeys";
import { deleteProductReview, listProductReviews } from "../api/products";
import { useApiClient } from "../context/ApiContext";

export function useProductReviews(id: string) {
  const client = useApiClient();

  return useQuery({
    queryKey: productKeys.reviews(id),
    queryFn: () => listProductReviews(client, id),
  });
}

export function useDeleteProductReview(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => deleteProductReview(client, id, reviewId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.reviews(id) });
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
