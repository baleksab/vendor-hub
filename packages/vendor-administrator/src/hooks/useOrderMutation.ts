import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrderResponse } from "@vendor-hub/types";

import { orderKeys } from "../api/queryKeys";
import type { ApiClient } from "../api/client";
import { useApiClient } from "../context/ApiContext";

export function useOrderMutation<Variables>(
  id: string,
  run: (client: ApiClient, id: string, variables: Variables) => Promise<OrderResponse>,
) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: Variables) => run(client, id, variables),
    onSuccess: async (updated) => {
      queryClient.setQueryData(orderKeys.detail(id), updated);
      await queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
