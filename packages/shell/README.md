# @mfe/shell

The host application of Vendor Hub. React Router 8 in framework mode with SSR, built with Vite. It renders the public pages on the server and loads microfrontends (remotes) in the browser through Module Federation.

## Stack

React 19, React Router 8, Mantine, Tailwind, `@module-federation/runtime`, openapi-fetch, Zod, Vitest.

## Scripts

Run from the repo root with `pnpm --filter @mfe/shell <script>`, or `pnpm dev` to start the shell together with the remotes.

| Script      | What it does                   |
| ----------- | ------------------------------ |
| `dev`       | dev server with HMR            |
| `build`     | production build into `build/` |
| `start`     | serves the built app           |
| `typecheck` | route typegen + `tsc --noEmit` |
| `test`      | unit tests                     |

## Configuration

Hosts, ports and URLs come from `.env` and `.env.local` through `env.ts`, which throws on a missing key. Change the port only in `.env.local`. Besides the shell and remote settings (the manifest URL of each remote), `API_URL` (the API origin, used only on the shell server) and `SESSION_COOKIE_NAME` / `SESSION_COOKIE_SECURE` (the cookie that holds the login token) are required. `SHELL_ORIGIN` is the public origin (the nginx one), not the dev server address. The API must be running for login, registration and the user menu (`pnpm server:dev`).

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the structure, layout, SEO, localization and how remotes are loaded.
