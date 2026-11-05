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
import { QueryProvider } from "./providers/QueryProvider";
import type { Route } from "./+types/root";
import "./app.css";
import { AppLayout } from "./components/AppLayout/AppLayout";
import { LOCALES } from "./i18n/locales";
import { LocaleProvider, useT } from "./i18n/LocaleProvider";
import { resolveLocale } from "./i18n/server";
import { theme } from "./theme";

export function links(): Route.LinkDescriptors {
  return [{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const env = getEnv();
  const locale = resolveLocale(request, env.defaultLocale);
  const { session, headers } = await getSession(request);

  return routeData(
    {
      locale,
      origin: env.origin,
      remoteTestManifestUrl: env.remoteTestManifestUrl,
      user: session?.user ?? null,
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
          <LocaleProvider locale={locale}>
            {data ? <QueryProvider origin={data.origin}>{children}</QueryProvider> : children}
          </LocaleProvider>
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App(_props: Route.ComponentProps) {
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
