import { useMutation, useQueryClient } from "@tanstack/react-query";

import { vendorKeys } from "../api/queryKeys";
import { addOperator } from "../api/vendors";
import { useApiClient } from "../context/ApiContext";

export function useAddOperator(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => addOperator(client, id, email),
    onSuccess: async (updated) => {
      queryClient.setQueryData(vendorKeys.detail(id), updated);
      await queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}
