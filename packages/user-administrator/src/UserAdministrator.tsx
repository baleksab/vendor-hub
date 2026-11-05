import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@vendor-hub/api-client";
import type { UserAdministratorProps } from "@vendor-hub/types";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import { Skeleton } from "@mantine/core";

import { createUsersClient } from "./api/client";
import { ApiContext } from "./context/ApiContext";
import { MessagesContext } from "./context/MessagesContext";
import { createT } from "./i18n/messages";
import { USERS_PATH } from "./paths";

const UserList = lazy(() => import("./pages/UserList/UserList"));
const UserDetail = lazy(() => import("./pages/UserDetail/UserDetail"));

const NOT_RETRIED_STATUSES = [401, 403, 404];
const MAX_RETRIES = 2;

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES &&
          !(error instanceof ApiError && NOT_RETRIED_STATUSES.includes(error.status)),
      },
    },
  });
}

export default function UserAdministrator({
  locale,
  apiBaseUrl,
  onUnauthorized,
}: UserAdministratorProps) {
  const [queryClient] = useState(createQueryClient);
  const client = useMemo(() => createUsersClient(apiBaseUrl), [apiBaseUrl]);
  const t = useMemo(() => createT(locale), [locale]);

  useEffect(() => {
    const handleError = (error: unknown) => {
      if (error instanceof ApiError && error.kind === "unauthorized") {
        onUnauthorized();
      }
    };

    queryClient.getQueryCache().config.onError = handleError;
    queryClient.getMutationCache().config.onError = handleError;
  }, [queryClient, onUnauthorized]);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext value={client}>
        <MessagesContext value={t}>
          <Suspense fallback={<Skeleton height={96} />}>
            <Routes>
              <Route path="users" element={<UserList />} />
              <Route path="users/:id" element={<UserDetail />} />
              <Route path="*" element={<Navigate to={USERS_PATH} replace />} />
            </Routes>
          </Suspense>
        </MessagesContext>
      </ApiContext>
    </QueryClientProvider>
  );
}
