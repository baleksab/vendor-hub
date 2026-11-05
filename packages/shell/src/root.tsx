import {
  Alert,
  ColorSchemeScript,
  Container,
  MantineProvider,
  Title,
  mantineHtmlProps,
} from "@mantine/core";
import {
  data as routeData,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import { getEnv } from "./env.server";
import { getSession } from "./auth/session.server";
import type { Route } from "./+types/root";
import "./app.css";
import { AppLayout } from "./components/AppLayout/AppLayout";
import { VendorSiteLayout } from "./components/VendorSiteLayout/VendorSiteLayout";
import { LOCALES } from "./i18n/locales";
import { LocaleProvider, useT } from "./i18n/LocaleProvider";
import { resolveLocale } from "./i18n/server";
import { theme } from "./theme";
import { loadMyVendors } from "./vendor/myVendors.server";
import { readVendorSlug, vendorSiteOrigin } from "./vendor/vendorSite";

export function links(): Route.LinkDescriptors {
  return [{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const env = getEnv();
  const locale = resolveLocale(request, env.defaultLocale);
  const vendorSlug = readVendorSlug(request, env.vendorSlugHeader);

  if (vendorSlug !== null) {
    return {
      locale,
      origin: vendorSiteOrigin(env.vendorSiteOrigin, vendorSlug),
      remoteTestManifestUrl: env.remoteTestManifestUrl,
      user: null,
      vendors: null,
      isVendorSite: true,
    };
  }

  const { session, headers } = await getSession(request);
  const vendors = session === null ? null : await loadMyVendors(request, session).catch(() => null);

  return routeData(
    {
      locale,
      origin: env.origin,
      remoteTestManifestUrl: env.remoteTestManifestUrl,
      user: session?.user ?? null,
      vendors,
      isVendorSite: false,
    },
    { headers },
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  // The loader can fail (e.g. broken env), so the error page has no locale data.
  const locale = data?.locale ?? LOCALES[0];

  return (
    <html lang={locale} {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#228be6" />
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  if (loaderData.isVendorSite) {
    return (
      <VendorSiteLayout>
        <Outlet />
      </VendorSiteLayout>
    );
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const t = useT();
  const status = isRouteErrorResponse(error) ? error.status : 500;

  return (
    <Container size="sm" py="xl">
      <title>{t("app.title")}</title>
      <meta name="robots" content="noindex" />
      <Title order={1} mb="md">
        {status === 404 ? t("notFound.title") : t("error.title")}
      </Title>
      <Alert color="red" title={String(status)}>
        {status === 404 ? t("notFound.message") : t("error.message")}
      </Alert>
    </Container>
  );
}
