import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { queryKeys } from "../../api/queryKeys";
import { AUTH_MUTATION_SCOPE, useBrowserClients } from "../../providers/QueryProvider";

export function useLogoutMutation() {
  const { auth } = useBrowserClients();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationKey: [AUTH_MUTATION_SCOPE, "logout"],
    mutationFn: () => auth.post("/logout", {}),
    onSuccess: async () => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session.current(), null);
      await navigate("/");
    },
  });
}
