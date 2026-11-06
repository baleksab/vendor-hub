import type { VendorAdministratorProps } from "@vendor-hub/types";
import { PageSpinner } from "@vendor-hub/ui";
import { lazy, Suspense, useMemo } from "react";
import { Navigate, Route, Routes } from "react-router";

import { createVendorsClient } from "./api/client";
import { useUnauthorizedHandler } from "./hooks/useUnauthorizedHandler";
import { ApiContext } from "./context/ApiContext";
import { LocaleContext } from "./context/LocaleContext";
import { MessagesContext } from "./context/MessagesContext";
import { createT } from "./i18n/messages";
import { VENDORS_PATH } from "./paths";

const VendorList = lazy(() => import("./pages/VendorList/VendorList"));
const VendorDetail = lazy(() => import("./pages/VendorDetail/VendorDetail"));
const ProductList = lazy(() => import("./pages/ProductList/ProductList"));
const ProductForm = lazy(() => import("./pages/ProductForm/ProductForm"));
const OrderList = lazy(() => import("./pages/OrderList/OrderList"));
const OrderDetail = lazy(() => import("./pages/OrderDetail/OrderDetail"));

export default function VendorAdministrator({
  locale,
  apiBaseUrl,
  onUnauthorized,
}: VendorAdministratorProps) {
  const client = useMemo(() => createVendorsClient(apiBaseUrl), [apiBaseUrl]);
  const t = useMemo(() => createT(locale), [locale]);

  useUnauthorizedHandler(onUnauthorized);

  return (
    <ApiContext value={client}>
      <LocaleContext value={locale}>
        <MessagesContext value={t}>
          <Suspense fallback={<PageSpinner label={t("common.loading")} />}>
            <Routes>
              <Route path="vendors" element={<VendorList />} />
              <Route path="vendors/:id" element={<VendorDetail />} />
              <Route path="vendors/:id/products" element={<ProductList />} />
              <Route path="vendors/:id/products/new" element={<ProductForm />} />
              <Route path="vendors/:id/products/:productId" element={<ProductForm />} />
              <Route path="vendors/:id/orders" element={<OrderList />} />
              <Route path="vendors/:id/orders/:orderId" element={<OrderDetail />} />
              <Route path="*" element={<Navigate to={VENDORS_PATH} replace />} />
            </Routes>
          </Suspense>
        </MessagesContext>
      </LocaleContext>
    </ApiContext>
  );
}
