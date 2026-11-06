import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@vendor-hub/api-client";

const NOT_RETRIED_STATUSES = [401, 403, 404];
const MAX_RETRIES = 2;
const STALE_TIME_MS = 30_000;

export const queryClient = new QueryClient({
  queryCache: new QueryCache(),
  mutationCache: new MutationCache(),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: STALE_TIME_MS,
      retry: (failureCount, error) =>
        failureCount < MAX_RETRIES &&
        !(error instanceof ApiError && NOT_RETRIED_STATUSES.includes(error.status)),
    },
  },
});
