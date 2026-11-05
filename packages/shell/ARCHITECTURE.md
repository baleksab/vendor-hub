# Architecture: `@mfe/shell`

The host application. React Router 8 in framework mode with SSR, built with Vite. It renders the page chrome and routes on the server and loads remotes in the browser.

## Layout

```
packages/shell/
├── src/
│   ├── root.tsx            document Layout, root loader (locale, origin, manifest URL), ErrorBoundary
│   ├── routes.ts           route config
│   ├── pages/              src/pages/{Name}/{Name}.tsx, one folder per page
│   │   ├── Home/
│   │   ├── RemoteTest/     components/ (RemoteSlot, RemoteErrorBoundary, RemoteFallback), loadWidget.ts
│   │   └── NotFound/       splat route, 404 + noindex
│   ├── components/         shared: AppLayout, NavLink, LanguageSwitcher
│   ├── hooks/              shared: useIsClient
│   ├── seo/                createPageMeta, pageMeta, buildRobots, buildSitemap, indexablePages
│   ├── routes/             resource routes only: locale.ts, robots.txt.ts, sitemap.xml.ts
│   ├── i18n/               locales, messages (en, sr), createT, LocaleProvider, server-side resolveLocale
│   ├── remote.ts           Module Federation runtime instance
│   ├── theme.ts            Mantine theme
│   ├── globals.d.ts        MANTINE_VERSION global
│   └── app.css             layer order, Tailwind, Mantine CSS
├── public/                 favicon.svg
├── env.ts                  typed, validated env (throws on a missing key)
├── react-router.config.ts  appDirectory: "src", ssr: true
├── vite.config.ts          Tailwind + reactRouter(), server host/port from env
├── scripts/start.mjs       validates env, starts react-router-serve
├── .env / .env.local       env contract / local values
└── tsconfig.json
```

## Server side

- `root.tsx` has the `loader` that reads env with `readShellEnv(process.env)` and returns the locale, the public origin and the remote manifest URL. Env is read on the server only; the client gets the URL as loader data.
- `Layout` renders the HTML document with `mantineHtmlProps`, `ColorSchemeScript` in `<head>` and `MantineProvider` (theme from `src/theme.ts`) around the children. Mantine is server-rendered; its CSS is static, so SSR needs no style extraction.
- `Layout` renders the HTML document. SSR output includes the route markup and, for remote routes, a skeleton.
- `pnpm build` produces `build/`; `pnpm start` runs `scripts/start.mjs`, which checks the env keys and maps `SHELL_HOST`/`SHELL_PORT` to the `HOST`/`PORT` that `react-router-serve` expects.

## Layout and pages

`AppLayout` wraps the `Outlet` in a Mantine `AppShell`. The header has the logo, `NavLink`s (active state from `useMatch`) and `LanguageSwitcher` from `sm` up. Below `sm` a `Burger` opens a `Drawer` with the same links and the language switcher. Design is mobile first. Unknown URLs hit the splat route `NotFound` (status 404, `noindex`), and the root `ErrorBoundary` renders other errors, also `noindex`.

## SEO

Every page exports `meta`. `pageMeta(matches, { titleKey, descriptionKey, path, noindex? })` reads locale and origin from the root loader data and calls `createPageMeta`, which builds `<title>`, `description`, the canonical link (skipped for `noindex` pages), Open Graph and Twitter tags. Titles and descriptions are i18n keys (`seo.*`). `routes/robots.txt.ts` and `routes/sitemap.xml.ts` are resource routes built from `SHELL_ORIGIN`; the sitemap lists `seo/indexablePages.ts`. `seo/pages.test.ts` fails if a page has no `meta` or an indexable path has no page.

## Localization

`src/i18n` is a small own layer with no dependency. `messages/en.ts` is the source of truth (`as const`); `sr.ts` uses `satisfies Messages`, so a missing or extra key fails `tsc`, and `t("key", params)` is typed from the English strings. `resolveLocale` picks the locale on the server: `locale` cookie, then `Accept-Language`, then `DEFAULT_LOCALE` from env. The root loader returns it, `Layout` sets `<html lang>` and `LocaleProvider`, so server and client render the same text. `POST /locale` (`routes/locale.ts`) sets the cookie and redirects back, which also works without JS. `createT` does not depend on React, so remotes can reuse it later.

New language: add `messages/<code>.ts`, register it in `catalogs` in `i18n/index.ts` and in `LOCALES`.

## Loading a remote

`src/remote.ts` creates one `@module-federation/runtime` instance (`createInstance`) with the list of remotes and the `shared` config. It does not use the `@module-federation/vite` plugin. `react`, `react-dom`, `@mantine/core` and `@mantine/hooks` are provided as `singleton` with the shell's own copy. The Mantine version comes from the `MANTINE_VERSION` global, which `vite.config.ts` fills from the installed package.

`pages/RemoteTest/RemoteTest.tsx` does the loading (`components/RemoteSlot.tsx`, `loadWidget.ts`):

1. `useIsClient` (`hooks/useIsClient`, built on `useSyncExternalStore`) is `false` on the server and during hydration, so the server and the first client render both show a skeleton. No hydration mismatch.
2. After hydration the route calls `loadRemote("remote-test/Widget")` and caches the promise per manifest URL.
3. The module is read with `use()` inside `Suspense`, wrapped in an error boundary that shows a message if the remote cannot be loaded.

A new remote means: a new entry in `remotes` in `remote.ts`, a manifest URL key in `env.ts` and the env files, and a route that loads it the same way.

## Tests

Unit tests use Vitest and live next to the code as `src/**/*.test.ts`. They cover pure logic (i18n, SEO helpers) and check that every page exports `meta`, with no DOM and no React rendering. `vitest.config.ts` is a separate file on purpose, so tests do not load the `reactRouter()` plugin and do not need `.env` (`env.ts` throws on a missing key). Do not import `env.ts` from code under test.

CI (`.github/workflows/checks.yml`) runs format, lint, typecheck, build and unit tests as separate jobs on every PR and on pushes to `main`.

## Rules specific to this package

- React Router packages are pinned here and must all match.
- `react` and `react-dom` stay `singleton` in the `shared` config in `remote.ts`.
- Nothing in the shell may assume a remote runs on the server.
- API types come from `@vendor-hub/types`, a devDependency used with `import type` only, so nothing from it ends up in the bundle.
