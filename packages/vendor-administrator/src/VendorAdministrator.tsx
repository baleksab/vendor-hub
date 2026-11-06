import { QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@vendor-hub/api-client";
import type { VendorAdministratorProps } from "@vendor-hub/types";
import { PageSpinner } from "@vendor-hub/ui";
import { lazy, Suspense, useEffect, useMemo } from "react";
import { Navigate, Route, Routes } from "react-router";

import { createVendorsClient } from "./api/client";
import { queryClient } from "./api/queryClient";
import { ApiContext } from "./context/ApiContext";
import { LocaleContext } from "./context/LocaleContext";
import { MessagesContext } from "./context/MessagesContext";
import { createT } from "./i18n/messages";
import { VENDORS_PATH } from "./paths";

const VendorList = lazy(() => import("./pages/VendorList/VendorList"));
const VendorDetail = lazy(() => import("./pages/VendorDetail/VendorDetail"));

export default function VendorAdministrator({
  locale,
  apiBaseUrl,
  onUnauthorized,
}: VendorAdministratorProps) {
  const client = useMemo(() => createVendorsClient(apiBaseUrl), [apiBaseUrl]);
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
                <Route path="vendors" element={<VendorList />} />
                <Route path="vendors/:id" element={<VendorDetail />} />
                <Route path="*" element={<Navigate to={VENDORS_PATH} replace />} />
              </Routes>
            </Suspense>
          </MessagesContext>
        </LocaleContext>
      </ApiContext>
    </QueryClientProvider>
  );
}
