import { useMutation, useQueryClient } from "@tanstack/react-query";

import { productKeys } from "../api/queryKeys";
import { deleteProductImage, reorderProductImages, uploadProductImage } from "../api/products";
import { useApiClient } from "../context/ApiContext";

function useRefreshProduct(id: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
  };
}

export function useUploadProductImage(id: string) {
  const client = useApiClient();
  const refresh = useRefreshProduct(id);

  return useMutation({
    mutationFn: (file: File) => uploadProductImage(client, id, file),
    onSuccess: refresh,
  });
}

export function useReorderProductImages(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  const refresh = useRefreshProduct(id);

  return useMutation({
    mutationFn: (imageIds: string[]) => reorderProductImages(client, id, imageIds),
    onSuccess: async (updated) => {
      queryClient.setQueryData(productKeys.detail(id), updated);
      await refresh();
    },
  });
}

export function useDeleteProductImage(id: string) {
  const client = useApiClient();
  const refresh = useRefreshProduct(id);

  return useMutation({
    mutationFn: (imageId: string) => deleteProductImage(client, id, imageId),
    onSuccess: refresh,
  });
}
