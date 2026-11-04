# Architecture: `@mfe/shell`

The host application. React Router 8 in framework mode with SSR, built with Vite. It renders the page chrome and routes on the server and loads remotes in the browser.

## Layout

```
packages/shell/
├── app/
│   ├── root.tsx            document Layout, root loader, nav
│   ├── i18n/               locales, messages (en, sr), createT, LocaleProvider, server-side resolveLocale
│   ├── components/         LanguageSwitcher.tsx
│   ├── routes.ts           route config
│   ├── routes/
│   │   ├── home.tsx
│   │   ├── locale.ts       resource route: sets the locale cookie
│   │   └── remote-test.tsx host route for the remote
│   ├── remote.ts           Module Federation runtime instance
│   ├── theme.ts            Mantine theme
│   ├── globals.d.ts        MANTINE_VERSION global
│   └── app.css             layer order, Tailwind, Mantine CSS
├── env.ts                  typed, validated env (throws on a missing key)
├── react-router.config.ts  appDirectory, ssr: true
├── vite.config.ts          Tailwind + reactRouter(), server host/port from env
├── scripts/start.mjs       validates env, starts react-router-serve
├── .env / .env.local       env contract / local values
└── tsconfig.json
```

## Server side

- `root.tsx` has the `loader` that reads env with `readShellEnv(process.env)` and returns the remote manifest URL. Env is read on the server only; the client gets the URL as loader data.
- `Layout` renders the HTML document with `mantineHtmlProps`, `ColorSchemeScript` in `<head>` and `MantineProvider` (theme from `app/theme.ts`) around the children. Mantine is server-rendered; its CSS is static, so SSR needs no style extraction.
- `Layout` renders the HTML document. SSR output includes the route markup and, for remote routes, a skeleton.
- `pnpm build` produces `build/`; `pnpm start` runs `scripts/start.mjs`, which checks the env keys and maps `SHELL_HOST`/`SHELL_PORT` to the `HOST`/`PORT` that `react-router-serve` expects.

## Localization

`app/i18n` is a small own layer with no dependency. `messages/en.ts` is the source of truth (`as const`); `sr.ts` uses `satisfies Messages`, so a missing or extra key fails `tsc`, and `t("key", params)` is typed from the English strings. `resolveLocale` picks the locale on the server: `locale` cookie, then `Accept-Language`, then `DEFAULT_LOCALE` from env. The root loader returns it, `Layout` sets `<html lang>` and `LocaleProvider`, so server and client render the same text. `POST /locale` (`routes/locale.ts`) sets the cookie and redirects back, which also works without JS. `createT` does not depend on React, so remotes can reuse it later.

New language: add `messages/<code>.ts`, register it in `catalogs` in `i18n/index.ts` and in `LOCALES`.

## Loading a remote

`app/remote.ts` creates one `@module-federation/runtime` instance (`createInstance`) with the list of remotes and the `shared` config. It does not use the `@module-federation/vite` plugin. `react`, `react-dom`, `@mantine/core` and `@mantine/hooks` are provided as `singleton` with the shell's own copy. The Mantine version comes from the `MANTINE_VERSION` global, which `vite.config.ts` fills from the installed package.

`routes/remote-test.tsx` does the loading:

1. `useIsClient` (`useSyncExternalStore`) is `false` on the server and during hydration, so the server and the first client render both show a skeleton. No hydration mismatch.
2. After hydration the route calls `loadRemote("remote-test/Widget")` and caches the promise per manifest URL.
3. The module is read with `use()` inside `Suspense`, wrapped in an error boundary that shows a message if the remote cannot be loaded.

A new remote means: a new entry in `remotes` in `remote.ts`, a manifest URL key in `env.ts` and the env files, and a route that loads it the same way.

## Tests

Unit tests use Vitest and live next to the code as `app/**/*.test.ts`. For now they cover only pure logic (i18n), with no DOM and no React rendering. `vitest.config.ts` is a separate file on purpose, so tests do not load the `reactRouter()` plugin and do not need `.env` (`env.ts` throws on a missing key). Do not import `env.ts` from code under test.

CI (`.github/workflows/checks.yml`) runs format, lint, typecheck, build and unit tests as separate jobs on every PR and on pushes to `main`.

## Rules specific to this package

- React Router packages are pinned here and must all match.
- `react` and `react-dom` stay `singleton` in the `shared` config in `remote.ts`.
- Nothing in the shell may assume a remote runs on the server.
