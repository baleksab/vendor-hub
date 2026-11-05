import { useSearchParams } from "react-router";

import { useBrowserClients } from "../../api/useBrowserClients";
import type { CreateUserRequest, UserResponse } from "../../api/types";
import { safeRedirectTo } from "../../auth/safeRedirect";
import { useAsyncAction } from "../useAsyncAction/useAsyncAction";

export function useRegisterMutation() {
  const { api, auth } = useBrowserClients();
  const [searchParams] = useSearchParams();

  return useAsyncAction(
    async (request: CreateUserRequest) => {
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
    {
      redirectOnUnauthorized: false,
      onSuccess: (user) =>
        window.location.assign(
          user === null ? "/login?registered=1" : safeRedirectTo(searchParams.get("redirectTo")),
        ),
    },
  );
}
