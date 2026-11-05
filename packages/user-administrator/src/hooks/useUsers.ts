import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { userKeys, type UserListParams } from "../api/queryKeys";
import { listUsers } from "../api/users";
import { useApiClient } from "../context/ApiContext";

export function useUsers(params: UserListParams) {
  const client = useApiClient();

  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(client, params),
    placeholderData: keepPreviousData,
  });
}
