import { useMutation, useQueryClient } from "@tanstack/react-query";

import { vendorKeys } from "../api/queryKeys";
import { removeOperator } from "../api/vendors";
import { useApiClient } from "../context/ApiContext";

export function useRemoveOperator(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeOperator(client, id, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}
