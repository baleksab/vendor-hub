import { QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@vendor-hub/api-client";
import { queryClient } from "./api/queryClient";
import type { UserAdministratorProps } from "@vendor-hub/types";
import { lazy, Suspense, useEffect, useMemo } from "react";
import { Navigate, Route, Routes } from "react-router";
import { PageSpinner } from "@vendor-hub/ui";

import { createUsersClient } from "./api/client";
import { ApiContext } from "./context/ApiContext";
import { LocaleContext } from "./context/LocaleContext";
import { MessagesContext } from "./context/MessagesContext";
import { createT } from "./i18n/messages";
import { USERS_PATH } from "./paths";

const UserList = lazy(() => import("./pages/UserList/UserList"));
const UserDetail = lazy(() => import("./pages/UserDetail/UserDetail"));

export default function UserAdministrator({
  locale,
  apiBaseUrl,
  onUnauthorized,
}: UserAdministratorProps) {
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
  }, [onUnauthorized]);

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext value={client}>
        <LocaleContext value={locale}>
          <MessagesContext value={t}>
            <Suspense fallback={<PageSpinner label={t("common.loading")} />}>
              <Routes>
                <Route path="users" element={<UserList />} />
                <Route path="users/:id" element={<UserDetail />} />
                <Route path="*" element={<Navigate to={USERS_PATH} replace />} />
              </Routes>
            </Suspense>
          </MessagesContext>
        </LocaleContext>
      </ApiContext>
    </QueryClientProvider>
  );
}
