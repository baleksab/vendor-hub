import type { Locale, UserAdministratorProps } from "@vendor-hub/types";
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
import type { Route } from "./+types/Admin";

type UserAdministratorModule = { default: ComponentType<UserAdministratorProps> };

const FORBIDDEN = 403;

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await requireUser(request);

  if (user.role !== "administrator") {
    throw new Response("Forbidden", { status: FORBIDDEN });
  }

  return null;
}

export function shouldRevalidate() {
  return false;
}

export function meta({ matches }: Route.MetaArgs) {
  return pageMeta(matches, {
    titleKey: "seo.admin.title",
    descriptionKey: "seo.admin.description",
    path: "/admin/users",
    noindex: true,
  });
}

type RemoteProps = { manifestUrls: RemoteManifestUrls; origin: string; locale: Locale };

function UserAdministratorRemote({ manifestUrls, origin, locale }: RemoteProps) {
  const { default: UserAdministrator } = use(
    loadRemoteModule<UserAdministratorModule>(manifestUrls, "user-administrator/UserAdministrator"),
  );
  const navigate = useNavigate();
  const location = useLocation();

  const handleUnauthorized = () => {
    void navigate(loginPath(location.pathname + location.search));
  };

  return (
    <UserAdministrator locale={locale} apiBaseUrl={origin} onUnauthorized={handleUnauthorized} />
  );
}

export default function Admin() {
  const t = useT();
  const locale = useLocale();
  const data = useRouteLoaderData<typeof rootLoader>("root");
  const isClient = useIsClient();

  if (!isClient || !data) {
    return <RemoteFallback />;
  }

  return (
    <RemoteSlot errorTitle={t("admin.error.title")} errorMessage={t("admin.error.message")}>
      <UserAdministratorRemote
        manifestUrls={data.remoteManifestUrls}
        origin={data.origin}
        locale={locale}
      />
    </RemoteSlot>
  );
}
