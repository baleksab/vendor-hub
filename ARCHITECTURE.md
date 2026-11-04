# Architecture: monorepo

A microfrontend setup in a pnpm workspace, plus a REST API server. One host (the shell) renders the page on the server and loads independently built remotes in the browser through Module Federation.

```
projekat/
├── packages/
│   ├── shell/          host app, React Router 8 framework mode, SSR
│   ├── remote-test/    test remote, Vite + Module Federation, client-only
│   └── server/         REST API, Fastify + Zod (not part of the microfrontend runtime)
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

## Boundaries

- **The server is a separate process.** It does not take part in Module Federation. The shell does not call it yet. It runs on its own with `pnpm server:dev` and is not started by `pnpm dev`.
- **Only the shell is SSR.** Remotes are client bundles and never run on the server. This also keeps the door open for non-React remotes.
- **Shell and remotes know each other only through** the manifest URL, the exposed module names and the shared module list.
- **Root has only framework-agnostic tooling** (`typescript`, `oxlint`, `oxlint-tsgolint`, `oxfmt`, `husky`). Everything tied to React, Vite, Tailwind or the router lives in the package that uses it.

## UI: Mantine

- The shell owns the theme (`app/theme.ts`), the `MantineProvider`, `ColorSchemeScript` and the global Mantine CSS (`@mantine/core/styles.layer.css`).
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
| `pnpm build`                   | remote, then shell, then server          |
| `pnpm test`                    | Vitest in shell and server               |
| `pnpm lint` / `lint:fix`       | oxlint                                   |
| `pnpm typecheck`               | typecheck in every package               |
| `pnpm check`                   | lint + typecheck + build                 |
| `pnpm format` / `format:check` | oxfmt                                    |
