import { useQueryClient } from "@tanstack/react-query";
import type { MutationCacheNotifyEvent, QueryCacheNotifyEvent } from "@tanstack/react-query";
import { ApiError } from "@vendor-hub/api-client";
import { useEffect } from "react";

type CacheEvent = QueryCacheNotifyEvent | MutationCacheNotifyEvent;

function isUnauthorized(event: CacheEvent): boolean {
  return (
    event.type === "updated" &&
    event.action.type === "error" &&
    event.action.error instanceof ApiError &&
    event.action.error.kind === "unauthorized"
  );
}

export function useUnauthorizedHandler(onUnauthorized: () => void) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handle = (event: CacheEvent) => {
      if (isUnauthorized(event)) {
        onUnauthorized();
      }
    };
    const stopQueries = queryClient.getQueryCache().subscribe(handle);
    const stopMutations = queryClient.getMutationCache().subscribe(handle);

    return () => {
      stopQueries();
      stopMutations();
    };
  }, [queryClient, onUnauthorized]);
}
