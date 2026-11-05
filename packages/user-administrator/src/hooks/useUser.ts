import { useQuery } from "@tanstack/react-query";

import { userKeys } from "../api/queryKeys";
import { getUser } from "../api/users";
import { useApiClient } from "../context/ApiContext";

export function useUser(id: string) {
  const client = useApiClient();

  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(client, id),
  });
}
