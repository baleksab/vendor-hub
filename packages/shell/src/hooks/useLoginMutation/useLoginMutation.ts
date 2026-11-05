import { useSearchParams } from "react-router";

import { useBrowserClients } from "../../api/useBrowserClients";
import type { LoginRequest, UserResponse } from "../../api/types";
import { safeRedirectTo } from "../../auth/safeRedirect";
import { useAsyncAction } from "../useAsyncAction/useAsyncAction";

export function useLoginMutation() {
  const { auth } = useBrowserClients();
  const [searchParams] = useSearchParams();

  return useAsyncAction(
    async (credentials: LoginRequest) => {
      const { data } = await auth.post<UserResponse>("/login", credentials);

      return data;
    },
    {
      redirectOnUnauthorized: false,
      onSuccess: () => window.location.assign(safeRedirectTo(searchParams.get("redirectTo"))),
    },
  );
}
