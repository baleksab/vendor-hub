import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";

import { queryKeys } from "../../api/queryKeys";
import type { CreateUserRequest, UserResponse } from "../../api/types";
import { safeRedirectTo } from "../../auth/safeRedirect";
import { AUTH_MUTATION_SCOPE, useBrowserClients } from "../../providers/QueryProvider";

export function useRegisterMutation() {
  const { api, auth } = useBrowserClients();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return useMutation({
    mutationKey: [AUTH_MUTATION_SCOPE, "register"],
    mutationFn: async (request: CreateUserRequest) => {
      await api.post("/users", request);

      try {
        const { data } = await auth.post<UserResponse>("/login", {
          email: request.email,
          password: request.password,
        });

        return data;
      } catch {
        return null;
      }
    },
    onSuccess: async (user) => {
      if (user === null) {
        await navigate("/login?registered=1");

        return;
      }

      queryClient.setQueryData(queryKeys.session.current(), user);
      await navigate(safeRedirectTo(searchParams.get("redirectTo")));
    },
  });
}
