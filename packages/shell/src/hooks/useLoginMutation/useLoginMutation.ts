import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";

import { queryKeys } from "../../api/queryKeys";
import type { LoginRequest, UserResponse } from "../../api/types";
import { safeRedirectTo } from "../../auth/safeRedirect";
import { AUTH_MUTATION_SCOPE, useBrowserClients } from "../../providers/QueryProvider";

export function useLoginMutation() {
  const { auth } = useBrowserClients();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return useMutation({
    mutationKey: [AUTH_MUTATION_SCOPE, "login"],
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await auth.post<UserResponse>("/login", credentials);

      return data;
    },
    onSuccess: async (user) => {
      queryClient.setQueryData(queryKeys.session.current(), user);
      await navigate(safeRedirectTo(searchParams.get("redirectTo")));
    },
  });
}
