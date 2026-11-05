# Architecture: `@mfe/shell`

The host application. React Router 8 in framework mode with SSR, built with Vite. It renders the page chrome and routes on the server and loads remotes in the browser.

## Layout

```
packages/shell/
├── src/
│   ├── root.tsx            document Layout, root loader (locale, origin, manifest URL, user), ErrorBoundary
│   ├── routes.ts           route config
│   ├── pages/              src/pages/{Name}/{Name}.tsx, one folder per page
│   │   ├── Home/           landing page: components/ (Hero, Features, Steps, Architecture, CallToAction, inline SVG illustration and icons)
│   │   ├── Vendors/        `/vendors`, the paginated vendor list (components/VendorList)
│   │   ├── VendorSite/     `/vendors/:slug`, the public vendor page (components/VendorSiteContent)
│   │   ├── BecomeVendor/   vendor registration form, becomeVendorAction.server.ts, noindex
│   │   ├── Login/          login form, loginAction.server.ts, noindex
│   │   ├── Register/       registration form, registerAction.server.ts, countries from the API, noindex
│   │   ├── RemoteTest/     loads `remote-test/Widget`
│   │   ├── Admin/          `/admin/*`, loader allows administrators only, mounts the user-administrator remote, noindex
│   │   └── NotFound/       splat route, 404 + noindex
│   ├── components/         shared: AppLayout, NavLink, LanguageSwitcher, UserMenu, FormField, FormAlert, RemoteSlot, RemoteErrorBoundary, RemoteFallback
│   ├── hooks/              shared: useIsClient, useSession
│   ├── api/                createServerApi (client from `@vendor-hub/api-client`)
│   │   └── endpoints/      one `*.server.ts` per resource (auth, users, countries, vendors), the only place that knows API paths
│   ├── forms/              shared form helpers: readValues, invalid, failed, FormErrors, describeError, common Zod fields
│   ├── auth/               session cookie, getSession/requireUser, signIn, same-origin check, safeRedirect
│   ├── testing/            shared helpers for action tests
│   ├── vendor/             vendorPaths.ts (`/vendors` and `vendorPath(slug)`), myVendors.server.ts (per-request cache), vendorList.server.ts (vendor list page)
│   ├── env.server.ts       cached env for server-only code
│   ├── seo/                createPageMeta, pageMeta, buildRobots, buildSitemap, indexablePages
│   ├── proxy/              forwardApiRequest.server.ts, proxyAllowlist.ts
│   ├── routes/             resource routes only: locale.ts, logout.ts, apiProxy.ts, robots.txt.ts, sitemap.xml.ts
│   ├── i18n/               locales, messages (en, sr), createT, LocaleProvider, server-side resolveLocale
│   ├── remote.ts           Module Federation runtime instance, loadRemoteModule
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

- `root.tsx` has the `loader` that reads env with `getEnv()` (cached `readShellEnv(process.env)`) and returns the locale, the public origin, the remote manifest URL, the current user and the vendors of that user (`GET /vendors/me`, cached per request, `null` if the call fails). Env is read on the server only; the client gets the URL as loader data.
- `Layout` renders the HTML document with `mantineHtmlProps`, `ColorSchemeScript` in `<head>` and `MantineProvider` (theme from `@vendor-hub/ui`) around the children. Mantine is server-rendered; its CSS is static, so SSR needs no style extraction.
- `Layout` renders the HTML document. SSR output includes the route markup and, for remote routes, a skeleton.
- `pnpm build` produces `build/`; `pnpm start` runs `scripts/start.mjs`, which checks the env keys and maps `SHELL_HOST`/`SHELL_PORT` to the `HOST`/`PORT` that `react-router-serve` expects.

## Authentication

The shell is a backend-for-frontend for the access token. The browser never sees the JWT:

```
browser --(HttpOnly cookie, same origin)--> shell server --(Authorization: Bearer)--> API
```

- Login and register are React Router actions (`pages/Login/loginAction.server.ts` and `pages/Register/registerAction.server.ts`, called from the `action` of each page). They validate the form data with the Zod schemas, call the API, and answer with `redirect(..., { headers: { "Set-Cookie": ... } })`. The token never reaches a response body or client code. Logout is the `POST /logout` action (`routes/logout.ts`): clears the cookie and redirects home. After an action React Router revalidates the root loader, so the header updates without any client state.
- Registration creates the user and then logs in with the same credentials. If that login fails, the user lands on `/login?registered=1` with a notice.
- The cookie (`auth/sessionCookie.server.ts`) is `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` from env, with `Max-Age` from `expiresIn`. It holds the signed JWT as is, the shell cannot verify it, only the API does.
- CSRF: `assertSameOrigin` requires `Origin` equal to `SHELL_ORIGIN` on every non-GET request to these actions, on top of `SameSite=Lax`.
- `getSession(request)` (`auth/session.server.ts`) calls `GET /api/v1/users/me` once per request and clears the cookie if the API answers `401`. The root loader returns the `user`, so the first paint already has the right header, and `useSession` just reads it. `requireUser` redirects to `/login?redirectTo=...`, `redirectIfAuthenticated` is used by the login and register loaders. `redirectTo` is accepted only as a same-origin relative path (`auth/safeRedirect.ts`). The target is built with `requestTarget`, which strips the `.data` suffix and `_routes` param that single fetch adds to client-side navigation requests.
- Pages of the shell have no client-side API client: everything they need runs in loaders and actions on the server. Remotes that must call the API from the browser use the API proxy below.

### API proxy

`routes/apiProxy.ts` is registered as `api/v1/*` and handles every method through `proxy/forwardApiRequest.server.ts`. It answers `404` for anything outside the allowlist (`proxy/proxyAllowlist.ts`: `GET` and `PATCH` on `/api/v1/users` and `/api/v1/users/:id`), checks the `Origin` on non-GET requests (`assertSameOrigin`), answers `401` without a session cookie, and forwards method, path, query and body to `API_URL` with `Authorization: Bearer <token>` from the cookie. The `Cookie` header and other request headers are not forwarded, the response keeps only the status and `Content-Type`, and a failed upstream call becomes `502`. Adding a path to the allowlist is a deliberate change.

API calls use `openapi-fetch` with the `paths` type generated into `@vendor-hub/types`, so paths, methods, bodies and responses are checked by `tsc`. `createServerApi(token?)` builds the client, and every call is wrapped in `unwrap` (`@vendor-hub/api-client`). Calls are defined once per resource in `api/endpoints/*.server.ts`, and actions and loaders use those functions instead of building requests themselves.

API errors go through `ApiError` (`@vendor-hub/api-client`): `unwrap` turns every failed call (HTTP error or network failure) into `status`, `kind`, `title`, `detail` and `fieldErrors` parsed from `application/problem+json`. `describeError` (`forms/describeError.ts`) maps them to i18n keys for the forms (wrong credentials never say which field was wrong, a duplicate email lands on the email field).

Forms are a plain `<Form method="post">` with Mantine inputs. The action validates with the Zod schema next to the page (`pages/Login/loginSchema.ts`, `pages/Register/registerSchema.ts`) (messages are i18n keys) and returns `{ form, fields, values }`, which the page shows under the inputs (passwords are never sent back). The forms work without JavaScript. The register form takes its country list from the public `GET /api/v1/countries` (loaded in the route loader, retry with `useRevalidator`), labels come from `Intl.DisplayNames` in the UI language.

## Layout and pages

`AppLayout` wraps the `Outlet` in a Mantine `AppShell` with a left sidebar, like a chat app. The sidebar has the title, the `NavLink`s (active state from `useMatch`) and, at the bottom, the `LanguageSwitcher` and the `UserMenu` (log in / register buttons, or an avatar with the user name and a log out item). Below `sm` the sidebar is hidden and opens full width from a sticky top bar, closing again on navigation. Content sits in a centered `Container`.

The theme (`@vendor-hub/ui`, `src/theme.ts`) follows the GitHub (Primer) design system: a blue primary color, GitHub gray and dark scales, the system font stack with 14px body text, weight 600 headings, a 6px radius and flat bordered cards. Sizes are compact from `sm` up (44px touch targets below). `cssVariablesResolver` sets the dark-scheme border color.

## SEO

Every page exports `meta`. `pageMeta(matches, { titleKey, descriptionKey, path, noindex? })` reads locale and origin from the root loader data and calls `createPageMeta`, which builds `<title>`, `description`, the canonical link (skipped for `noindex` pages), Open Graph and Twitter tags. Titles and descriptions are i18n keys (`seo.*`). `routes/robots.txt.ts` and `routes/sitemap.xml.ts` are resource routes built from `SHELL_ORIGIN`; the sitemap lists `seo/indexablePages.ts`. `seo/pages.test.ts` fails if a page has no `meta` or an indexable path has no page.

## Localization

`src/i18n` is a small own layer with no dependency. `messages/en.ts` is the source of truth (`as const`); `sr.ts` uses `satisfies Messages`, so a missing or extra key fails `tsc`, and `t("key", params)` is typed from the English strings. `resolveLocale` picks the locale on the server: `locale` cookie, then `Accept-Language`, then `DEFAULT_LOCALE` from env. The root loader returns it, `Layout` sets `<html lang>` and `LocaleProvider`, so server and client render the same text. `POST /locale` (`routes/locale.ts`) sets the cookie and redirects back, which also works without JS. `createT` does not depend on React, so remotes can reuse it later.

New language: add `messages/<code>.ts`, register it in `catalogs` in `i18n/index.ts` and in `LOCALES`.

## Loading a remote

`src/remote.ts` creates one `@module-federation/runtime` instance (`createInstance`) with the list of remotes and the `shared` config. It does not use the `@module-federation/vite` plugin. `react`, `react-dom`, `react-router`, `@mantine/core` and `@mantine/hooks` are provided as `singleton` with the shell's own copy. `react-router` is shared so that the `<Routes>` of a remote follow the shell's router. The Mantine and React Router versions come from the `MANTINE_VERSION` and `REACT_ROUTER_VERSION` globals, which `vite.config.ts` fills from the installed packages.

`RemoteTest` and `Admin` do the loading with `loadRemoteModule` (`remote.ts`, caches the promise per module) inside `components/RemoteSlot` (error boundary + `Suspense`):

1. `useIsClient` (`hooks/useIsClient`, built on `useSyncExternalStore`) is `false` on the server and during hydration, so the server and the first client render both show a skeleton. No hydration mismatch.
2. After hydration the route calls `loadRemoteModule` for the module (`remote-test/Widget`, `user-administrator/UserAdministrator`).
3. The module is read with `use()` inside `Suspense`, wrapped in an error boundary that shows a message if the remote cannot be loaded.

A new remote means: a new entry in `remotes` and `RemoteName` in `remote.ts`, a manifest URL key in `env.ts`, the env files and `scripts/start.mjs`, and a route that loads it the same way.

### Administration

`Admin` (`/admin/*`) has a loader that calls `requireUser` and throws `403` when the user is not an administrator (`shouldRevalidate` is `false`, so navigating inside the remote does not call the API again). The component renders `user-administrator/UserAdministrator` with `locale`, `apiBaseUrl` (the shell origin) and `onUnauthorized`, which sends the user to `/login?redirectTo=...`. The "Administration" link in the sidebar is shown to administrators only. The authorization itself is enforced by the API.

## Tests

Unit tests use Vitest and live next to the code as `src/**/*.test.ts`. They cover pure logic (i18n, SEO helpers, API error mapping, form schemas, redirect validation), the auth resource routes with a mocked API (cookie flags, token never in a body, `401` clears the cookie, origin check) and check that every page exports `meta`, with no DOM and no React rendering. `vitest.config.ts` is a separate file on purpose, so tests do not load the `reactRouter()` plugin and do not need `.env` (`env.ts` throws on a missing key). Do not import `env.ts` from code under test.

CI (`.github/workflows/checks.yml`) runs format, lint, typecheck, build and unit tests as separate jobs on every PR and on pushes to `main`.

## Rules specific to this package

- React Router packages are pinned here and must all match.
- `react`, `react-dom` and `react-router` stay `singleton` in the `shared` config in `remote.ts`.
- Nothing in the shell may assume a remote runs on the server.
- API types come from `@vendor-hub/types`, a devDependency used with `import type` only, so nothing from it ends up in the bundle.

## Vendors and vendor sites

- `BecomeVendor` (`/become-vendor`) needs a logged-in user. An anonymous visitor is sent to `/login?redirectTo=/become-vendor` by `requireUser` and comes back after logging in. A user who already owns a vendor is redirected to its page, a slug conflict lands on the slug field (`describeError` context `vendor`), and after a successful registration the user is redirected to the new vendor page.
- `AppLayout` always shows "Become a vendor", except to a user who already owns a vendor. The root loader provides the vendors (`GET /vendors/me`), so the first paint is right.
- **Vendor list:** the `Vendors` loader (`/vendors`) reads `?page=` (page size `VENDORS_PAGE_SIZE`), loads `GET /api/v1/vendors` with `limit` and `offset` and renders the vendors as cards that link to `/vendors/:slug` (`VendorList`), with Mantine `Pagination` built from links, so it works without JavaScript. A page past the end redirects to the last page, and if the list cannot be loaded the rest of the page still renders with an error notice.
- **Vendor page:** `/vendors/:slug` is an ordinary route in the normal layout. Its loader calls the public `GET /vendors/by-slug/:slug` and answers `404` if the vendor does not exist. The page is public: no login is needed to see it. `meta` uses the vendor name and a cut of the description, with the canonical link on `/vendors/:slug`.
- Links to a vendor page are built with `vendorPath(slug)`.
