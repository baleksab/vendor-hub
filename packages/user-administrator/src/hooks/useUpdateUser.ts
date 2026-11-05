import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateUserRequest } from "@vendor-hub/types";

import { userKeys } from "../api/queryKeys";
import { updateUser } from "../api/users";
import { useApiClient } from "../context/ApiContext";

export function useUpdateUser(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateUserRequest) => updateUser(client, id, body),
    onSuccess: async (updated) => {
      queryClient.setQueryData(userKeys.detail(id), updated);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
