import { useQuery } from "@tanstack/react-query";
import { useRouteLoaderData } from "react-router";

import { ApiError } from "../../api/ApiError";
import { queryKeys } from "../../api/queryKeys";
import type { UserResponse } from "../../api/types";
import { useBrowserClients } from "../../providers/QueryProvider";
import type { loader } from "../../root";

export function useSession() {
  const { api } = useBrowserClients();
  const rootData = useRouteLoaderData<typeof loader>("root");

  const query = useQuery<UserResponse | null>({
    queryKey: queryKeys.session.current(),
    initialData: rootData?.user ?? null,
    queryFn: async () => {
      try {
        const { data } = await api.get<UserResponse>("/users/me");

        return data;
      } catch (error) {
        if (error instanceof ApiError && error.kind === "unauthorized") {
          return null;
        }

        throw error;
      }
    },
  });

  return { user: query.data ?? null };
}
