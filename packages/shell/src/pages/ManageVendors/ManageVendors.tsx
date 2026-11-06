import type { Locale, VendorAdministratorProps } from "@vendor-hub/types";
import { use, type ComponentType } from "react";
import { useLocation, useNavigate, useRouteLoaderData } from "react-router";

import { loginPath } from "../../auth/safeRedirect";
import { requireUser } from "../../auth/session.server";
import { RemoteFallback } from "../../components/RemoteFallback/RemoteFallback";
import { RemoteSlot } from "../../components/RemoteSlot/RemoteSlot";
import { useIsClient } from "../../hooks/useIsClient/useIsClient";
import { useLocale, useT } from "../../i18n/LocaleProvider";
import { loadRemoteModule, type RemoteManifestUrls } from "../../remote";
import type { loader as rootLoader } from "../../root";
import { pageMeta } from "../../seo/pageMeta";
import type { Route } from "./+types/ManageVendors";

type VendorAdministratorModule = { default: ComponentType<VendorAdministratorProps> };

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  return null;
}

export function shouldRevalidate() {
  return false;
}

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.manageVendors.title",
    descriptionKey: "seo.manageVendors.description",
    path: "/manage/vendors",
    noindex: true,
  });
}

type RemoteProps = { manifestUrls: RemoteManifestUrls; origin: string; locale: Locale };

function VendorAdministratorRemote({ manifestUrls, origin, locale }: RemoteProps) {
  const { default: VendorAdministrator } = use(
    loadRemoteModule<VendorAdministratorModule>(
      manifestUrls,
      "vendor-administrator/VendorAdministrator",
    ),
  );
  const navigate = useNavigate();
  const location = useLocation();

  const handleUnauthorized = () => {
    void navigate(loginPath(location.pathname + location.search));
  };

  return (
    <VendorAdministrator locale={locale} apiBaseUrl={origin} onUnauthorized={handleUnauthorized} />
  );
}

export default function ManageVendors() {
  const t = useT();
  const locale = useLocale();
  const data = useRouteLoaderData<typeof rootLoader>("root");
  const isClient = useIsClient();

  if (!isClient || !data) {
    return <RemoteFallback />;
  }

  return (
    <RemoteSlot errorTitle={t("manage.error.title")} errorMessage={t("manage.error.message")}>
      <VendorAdministratorRemote
        manifestUrls={data.remoteManifestUrls}
        origin={data.origin}
        locale={locale}
      />
    </RemoteSlot>
  );
}
