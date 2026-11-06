import type { UserAdministratorProps } from "@vendor-hub/types";
import { lazy, Suspense, useMemo } from "react";
import { Navigate, Route, Routes } from "react-router";
import { PageSpinner } from "@vendor-hub/ui";

import { createUsersClient } from "./api/client";
import { useUnauthorizedHandler } from "./hooks/useUnauthorizedHandler";
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

  useUnauthorizedHandler(onUnauthorized);

  return (
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
  );
}
