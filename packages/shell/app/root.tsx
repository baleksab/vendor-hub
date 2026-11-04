import {
  Anchor,
  ColorSchemeScript,
  Container,
  Group,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import { readShellEnv } from "../env.ts";
import type { Route } from "./+types/root";
import "./app.css";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { createT } from "./i18n";
import { LOCALES } from "./i18n/locales";
import { LocaleProvider, useT } from "./i18n/LocaleProvider";
import { resolveLocale } from "./i18n/server";
import { theme } from "./theme";

export function loader({ request }: Route.LoaderArgs) {
  const env = readShellEnv(process.env);
  const locale = resolveLocale(request, env.defaultLocale);

  return { locale, remoteTestManifestUrl: env.remoteTestManifestUrl };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  // The loader can fail (e.g. broken env), so the error page has no locale data.
  const locale = data?.locale ?? LOCALES[0];
  const t = createT(locale);

  return (
    <html lang={locale} {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{t("app.title")}</title>
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

export default function App(_props: Route.ComponentProps) {
  const t = useT();

  return (
    <Container size="sm" py="lg">
      <Group component="nav" mb="lg" gap="md">
        <Anchor component={Link} to="/">
          {t("nav.home")}
        </Anchor>
        <Anchor component={Link} to="/remote-test">
          {t("nav.remoteTest")}
        </Anchor>
        <LanguageSwitcher />
      </Group>

      <Outlet />
    </Container>
  );
}
