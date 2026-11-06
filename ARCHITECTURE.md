# Architecture: monorepo

A microfrontend setup in a pnpm workspace, plus a REST API server. One host (the shell) renders the page on the server and loads independently built remotes in the browser through Module Federation.

```
projekat/
├── packages/
│   ├── shell/          host app, React Router 8 framework mode, SSR
│   ├── user-administrator/ remote with the admin user pages (TanStack Query, React Router routes)
│   ├── vendor-administrator/ remote with the vendor management pages (list, quick view, detail)
│   ├── server/         REST API, Fastify + Zod (not part of the microfrontend runtime)
│   └── types/          API types generated from the server's OpenAPI document (@vendor-hub/types)
│   ├── api-client/     shared typed fetch client, unwrap, ApiError (@vendor-hub/api-client)
│   └── ui/             Mantine theme, design tokens, common components (@vendor-hub/ui)
├── infra/nginx/        nginx template for the site (docker compose service)
├── scripts/            deploy.sh (one-command deploy), healthcheck.mjs (container health probe)
├── Dockerfile          one build stage, one target per app (server, shell, user-administrator, vendor-administrator)
├── docker-compose.yml  Postgres and nginx (also used for local development)
├── docker-compose.deploy.yml  overlay for the full stack: migrate, server, shell, user-administrator, vendor-administrator
├── pnpm-workspace.yaml workspace + dependency catalog
├── tsconfig.base.json  shared compiler options
├── .oxlintrc.json      shared lint rules
├── .oxfmtrc.json       formatter config
└── .husky/pre-commit   runs lint and typecheck
```

## Runtime flow

1. The browser requests a page from the shell. The shell renders HTML on the server (SSR). Routes that need a remote render a loading spinner on the server.
2. After hydration the shell loads the remote's `mf-manifest.json` through `@module-federation/runtime`, then the exposed module, and renders it in place of the spinner.
3. `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `@mantine/core` and `@mantine/hooks` are `singleton` shared modules: the shell provides its copy, the remote uses it. There is exactly one React and one Mantine at runtime, so remote components see the shell's `MantineProvider` (theme and color scheme). Likewise the shell owns the one `QueryClient` (`QueryClientProvider` in `App`), so remotes share a cache and a mutation in one remote can invalidate queries of another. Query keys start with a per-remote prefix (`users`, `vendors`, `countries`).

The remotes' manifest URLs are not hardcoded in the shell. The root loader reads them from env and passes them to the client.

## Administration

```
browser --> nginx --> shell /admin/users   (loader: administrators only) --> user-administrator remote (client)
browser --> nginx --> shell /api/v1/users  (proxy: adds Bearer from the HttpOnly cookie) --> API
```

The `vendor-administrator` remote is mounted at `manage/*` (`/manage/vendors` and `/manage/vendors/:id`). Its shell route only requires a logged-in user, because the API decides what each user can see: administrators every vendor, everybody else the vendors they own or operate. The proxy allowlist is a table of method and path pattern entries, with `vendors/managed` and the vendor ids (matched as uuids, so `/vendors/me` never matches) added next to `/users` and `GET /countries`.

The `user-administrator` remote is mounted at `admin/*`. It calls the shell's own origin, and a resource route `api/v1/*` forwards an allowlisted set of paths (`/users` and the public `GET /countries`) to the API with the token from the cookie, so the JWT never reaches client JS and no CORS is needed. Authorization stays in the API.

## Vendor sites

```
browser --> nginx (vendorhub.localhost) --> shell SSR (/vendors/:slug) --> GET /api/v1/vendors/by-slug/:slug
```

nginx (`infra/nginx/vendorhub.conf.template`, rendered with `envsubst` from `infra/nginx/.env.local`) is the only public entry and proxies everything on one domain to the shell. nginx accepts request bodies up to `NGINX_MAX_BODY_SIZE` (product image uploads), keep it above the server's `PRODUCT_IMAGE_MAX_BYTES`. The shell port is not published in production. Every vendor lives under a path of the same domain (`/vendors/:slug`), so adding a vendor never touches the nginx config. The shell renders the public vendor page, see the shell's `ARCHITECTURE.md`.

## Boundaries

- **The server is a separate process.** It does not take part in Module Federation. The shell server calls it (login, session, countries) from its loaders and actions, see the shell's `ARCHITECTURE.md`; the browser never talks to it directly and never holds the token. It runs on its own with `pnpm server:dev` and is not started by `pnpm dev`. It stores data in Postgres, started with `pnpm db:up` from the root `docker-compose.yml` (Postgres and nginx run in Docker, the apps run on the host).
- **Only the shell is SSR.** Remotes are client bundles and never run on the server. This also keeps the door open for non-React remotes.
- **Shell and remotes know each other only through** the manifest URL, the exposed module names and the shared module list.
- **Root has only framework-agnostic tooling** (`typescript`, `oxlint`, `oxlint-tsgolint`, `oxfmt`, `husky`). Everything tied to React, Vite, Tailwind or the router lives in the package that uses it.

## API contract

The server's Zod schemas are the single source of truth. `@fastify/swagger` turns them into an OpenAPI 3.1 document (`/swagger/schema.json`, Swagger UI at `/docs`), `openapi-typescript` turns that into `packages/types` (`@vendor-hub/types`), and the shell uses those types as a devDependency with `import type` only. The generated file is committed and regenerated with `pnpm types:generate` while the server is running.

## UI: Mantine

- The theme lives in `@vendor-hub/ui` (`src/theme.ts`) and the shell applies it in its `MantineProvider`; the shell owns the `MantineProvider`, `ColorSchemeScript` and the global Mantine CSS (`@mantine/core/styles.layer.css`).
- An embedded remote uses Mantine components without its own provider and without importing Mantine CSS. Only a remote's standalone entry (`main.tsx`) adds a provider and the CSS.
- Tailwind stays for layout. Both CSS files declare `@layer theme, base, mantine, components, utilities;` so utilities can override Mantine.
- `@mantine/core` and `@mantine/hooks` must always have the same version (catalog).

## Dependency management

`pnpm-workspace.yaml` holds a catalog with every shared version and `catalogMode: strict`, so packages must use `catalog:`. This keeps shell and remote on the same `react`, `vite` and `tailwindcss`. The only exception is React Router, pinned in the shell, where all `@react-router/*` packages and `react-router` must have the same version.

`.npmrc`: `save-exact`, `engine-strict`, `strict-peer-dependencies`, and a minimum release age of 3 days for new packages.

## Configuration

No hosts, ports or URLs in code. Each package has `.env` (keys with empty values and comments, documents the contract) and `.env.local` (committed local values, never secrets; secrets go to the gitignored `.env.secret`), read through that package's `env.ts`, which throws on a missing key. Ports are changed in `.env.local` files only: the shell's manifest URLs and origin, and each remote's public origin and allowed CORS origins.

## Tooling

- TypeScript 7 (`tsc`), strict, shared `tsconfig.base.json`; each package extends it.
- oxlint with type-aware rules. Root config has shared rules, each package config extends it and enables the plugins it needs (React, hooks, a11y).
- oxfmt for formatting.
- Husky pre-commit runs `pnpm lint` and `pnpm typecheck`.
- Node 24, pnpm version from `packageManager`.

## Root scripts

| Script                         | What it does                              |
| ------------------------------ | ----------------------------------------- |
| `pnpm dev`                     | shell and remote dev servers in parallel  |
| `pnpm server:dev`              | API server dev (isolated from `dev`)      |
| `pnpm db:up` / `db:down`       | start / stop Postgres (Docker Compose)    |
| `pnpm stack:deploy`            | build and start the whole stack in Docker |
| `pnpm stack:down`              | stop the Docker stack                     |
| `pnpm db:reset`                | stop Postgres and delete its volume       |
| `pnpm types:generate`          | regenerate API types (server must run)    |
| `pnpm build`                   | remotes, then shell, then server          |
| `pnpm test`                    | Vitest in shell, server and api-client    |
| `pnpm lint` / `lint:fix`       | oxlint                                    |
| `pnpm typecheck`               | typecheck in every package                |
| `pnpm check`                   | lint + typecheck + build                  |
| `pnpm format` / `format:check` | oxfmt                                     |

## Product images

Vendor members upload product images from the `vendor-administrator` remote as multipart requests through the shell proxy to the server, which checks the type by the file's first bytes and stores the file through its `ImageStorage` (a directory, `PRODUCT_IMAGE_DIR`). Browsers load images from the public `GET /api/v1/product-images/:id`, also through the proxy, with immutable caching. In the Docker deploy the directory is the `product-images` volume.
