import type { InsightsProps } from "@vendor-hub/types";
import { PageSpinner } from "@vendor-hub/ui";
import { lazy, Suspense, useMemo } from "react";
import { Navigate, Route, Routes } from "react-router";

import { createInsightsClient } from "./api/client";
import { ApiContext } from "./context/ApiContext";
import { LocaleContext } from "./context/LocaleContext";
import { MessagesContext } from "./context/MessagesContext";
import { useUnauthorizedHandler } from "./hooks/useUnauthorizedHandler";
import { createT } from "./i18n/messages";
import { INSIGHTS_PATH } from "./paths";

const VendorList = lazy(() => import("./pages/VendorList/VendorList"));
const VendorInsights = lazy(() => import("./pages/VendorInsights/VendorInsights"));
const ProductInsights = lazy(() => import("./pages/ProductInsights/ProductInsights"));

export default function Insights({ locale, apiBaseUrl, onUnauthorized }: InsightsProps) {
  const client = useMemo(() => createInsightsClient(apiBaseUrl), [apiBaseUrl]);
  const t = useMemo(() => createT(locale), [locale]);

  useUnauthorizedHandler(onUnauthorized);

  return (
    <ApiContext value={client}>
      <LocaleContext value={locale}>
        <MessagesContext value={t}>
          <Suspense fallback={<PageSpinner label={t("common.loading")} />}>
            <Routes>
              <Route path="vendors" element={<VendorList />} />
              <Route path="vendors/:id" element={<VendorInsights />} />
              <Route path="vendors/:id/products/:productId" element={<ProductInsights />} />
              <Route path="*" element={<Navigate to={INSIGHTS_PATH} replace />} />
            </Routes>
          </Suspense>
        </MessagesContext>
      </LocaleContext>
    </ApiContext>
  );
}
