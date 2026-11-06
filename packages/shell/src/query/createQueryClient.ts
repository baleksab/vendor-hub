import { QueryClient } from "@tanstack/react-query";

const NOT_RETRIED_STATUSES = [401, 403, 404];
const MAX_RETRIES = 2;
const STALE_TIME_MS = 30_000;

function statusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;

  return typeof status === "number" ? status : undefined;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: STALE_TIME_MS,
        retry: (failureCount, error) => {
          const status = statusOf(error);

          return (
            failureCount < MAX_RETRIES &&
            !(status !== undefined && NOT_RETRIED_STATUSES.includes(status))
          );
        },
      },
    },
  });
}
