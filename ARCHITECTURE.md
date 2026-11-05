# Architecture: monorepo

A microfrontend setup in a pnpm workspace, plus a REST API server. One host (the shell) renders the page on the server and loads independently built remotes in the browser through Module Federation.

```
projekat/
├── packages/
│   ├── shell/          host app, React Router 8 framework mode, SSR
│   ├── remote-test/    test remote, Vite + Module Federation, client-only
│   ├── server/         REST API, Fastify + Zod (not part of the microfrontend runtime)
│   └── types/          API types generated from the server's OpenAPI document (@vendor-hub/types)
├── infra/nginx/        nginx template for the site (docker compose service)
├── pnpm-workspace.yaml workspace + dependency catalog
├── tsconfig.base.json  shared compiler options
├── .oxlintrc.json      shared lint rules
├── .oxfmtrc.json       formatter config
└── .husky/pre-commit   runs lint and typecheck
```

## Runtime flow

1. The browser requests a page from the shell. The shell renders HTML on the server (SSR). Routes that need a remote render a skeleton on the server.
2. After hydration the shell loads the remote's `mf-manifest.json` through `@module-federation/runtime`, then the exposed module, and renders it in place of the skeleton.
3. `react`, `react-dom`, `@mantine/core` and `@mantine/hooks` are `singleton` shared modules: the shell provides its copy, the remote uses it. There is exactly one React and one Mantine at runtime, so remote components see the shell's `MantineProvider` (theme and color scheme).

The remote's manifest URL is not hardcoded in the shell. The root loader reads it from env and passes it to the client.

## Vendor sites

```
browser --> nginx (vendorhub.localhost) --> shell SSR (/vendors/:slug) --> GET /api/v1/vendors/by-slug/:slug
```

nginx (`infra/nginx/vendorhub.conf.template`, rendered with `envsubst` from `infra/nginx/.env.local`) is the only public entry and proxies everything on one domain to the shell. The shell port is not published in production. Every vendor lives under a path of the same domain (`/vendors/:slug`), so adding a vendor never touches the nginx config. The shell renders the public vendor page, see the shell's `ARCHITECTURE.md`.

## Boundaries

- **The server is a separate process.** It does not take part in Module Federation. The shell server calls it (login, session, countries) from its loaders and actions, see the shell's `ARCHITECTURE.md`; the browser never talks to it directly and never holds the token. It runs on its own with `pnpm server:dev` and is not started by `pnpm dev`. It stores data in Postgres, started with `pnpm db:up` from the root `docker-compose.yml` (Postgres and nginx run in Docker, the apps run on the host).
- **Only the shell is SSR.** Remotes are client bundles and never run on the server. This also keeps the door open for non-React remotes.
- **Shell and remotes know each other only through** the manifest URL, the exposed module names and the shared module list.
- **Root has only framework-agnostic tooling** (`typescript`, `oxlint`, `oxlint-tsgolint`, `oxfmt`, `husky`). Everything tied to React, Vite, Tailwind or the router lives in the package that uses it.

## API contract

The server's Zod schemas are the single source of truth. `@fastify/swagger` turns them into an OpenAPI 3.1 document (`/swagger/schema.json`, Swagger UI at `/docs`), `openapi-typescript` turns that into `packages/types` (`@vendor-hub/types`), and the shell uses those types as a devDependency with `import type` only. The generated file is committed and regenerated with `pnpm types:generate` while the server is running.

## UI: Mantine

- The shell owns the theme (`src/theme.ts`), the `MantineProvider`, `ColorSchemeScript` and the global Mantine CSS (`@mantine/core/styles.layer.css`).
- An embedded remote uses Mantine components without its own provider and without importing Mantine CSS. Only a remote's standalone entry (`main.tsx`) adds a provider and the CSS.
- Tailwind stays for layout. Both CSS files declare `@layer theme, base, mantine, components, utilities;` so utilities can override Mantine.
- `@mantine/core` and `@mantine/hooks` must always have the same version (catalog).

## Dependency management

`pnpm-workspace.yaml` holds a catalog with every shared version and `catalogMode: strict`, so packages must use `catalog:`. This keeps shell and remote on the same `react`, `vite` and `tailwindcss`. The only exception is React Router, pinned in the shell, where all `@react-router/*` packages and `react-router` must have the same version.

`.npmrc`: `save-exact`, `engine-strict`, `strict-peer-dependencies`, and a minimum release age of 3 days for new packages.

## Configuration

No hosts, ports or URLs in code. Each package has `.env` (keys with empty values and comments, documents the contract) and `.env.local` (committed local values, never secrets; secrets go to the gitignored `.env.secret`), read through that package's `env.ts`, which throws on a missing key. Ports are changed in `.env.local` files only: the shell's manifest URL and origin, and the remote's public origin and allowed CORS origins.

## Tooling

- TypeScript 7 (`tsc`), strict, shared `tsconfig.base.json`; each package extends it.
- oxlint with type-aware rules. Root config has shared rules, each package config extends it and enables the plugins it needs (React, hooks, a11y).
- oxfmt for formatting.
- Husky pre-commit runs `pnpm lint` and `pnpm typecheck`.
- Node 24, pnpm version from `packageManager`.

## Root scripts

| Script                         | What it does                             |
| ------------------------------ | ---------------------------------------- |
| `pnpm dev`                     | shell and remote dev servers in parallel |
| `pnpm server:dev`              | API server dev (isolated from `dev`)     |
| `pnpm db:up` / `db:down`       | start / stop Postgres (Docker Compose)   |
| `pnpm db:reset`                | stop Postgres and delete its volume      |
| `pnpm types:generate`          | regenerate API types (server must run)   |
| `pnpm build`                   | remote, then shell, then server          |
| `pnpm test`                    | Vitest in shell and server               |
| `pnpm lint` / `lint:fix`       | oxlint                                   |
| `pnpm typecheck`               | typecheck in every package               |
| `pnpm check`                   | lint + typecheck + build                 |
| `pnpm format` / `format:check` | oxfmt                                    |
