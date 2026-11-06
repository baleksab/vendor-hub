import { useMutation, useQueryClient } from "@tanstack/react-query";

import { vendorKeys } from "../api/queryKeys";
import { deleteVendor } from "../api/vendors";
import { useApiClient } from "../context/ApiContext";

export function useDeleteVendor(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteVendor(client, id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: vendorKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}
