# @mfe/insights

Read-only remote with vendor and product analytics: a table of the vendors the user owns or operates (search, relation filter, sorting by revenue, orders, products or rating, period and currency in the URL, `/insights/vendors`), a dive-in page per vendor with KPIs, revenue over time, orders by status, top products and top countries (`/insights/vendors/:id`) and one per product with units, revenue and rating charts (`/insights/vendors/:id/products/:productId`). Access is membership only: administrators see just the vendors they own or operate. Vite + React, exposed through Module Federation 2, client-only.

## Stack

React 19, React Router (routes inside the remote), TanStack Query, Mantine and `@mantine/charts` (Recharts), `@vendor-hub/api-client`, `@vendor-hub/ui`.

## Scripts

Run from the repo root with `pnpm --filter @mfe/insights <script>`, or `pnpm dev` to start it together with the shell.

| Script      | What it does                               |
| ----------- | ------------------------------------------ |
| `dev`       | standalone dev server                      |
| `build`     | production build, emits `mf-manifest.json` |
| `preview`   | serves the build (how the shell loads it)  |
| `typecheck` | `tsc --noEmit`                             |

## Usage

The shell loads `insights/Insights` at `/insights/*` and passes `locale`, `apiBaseUrl` and `onUnauthorized`. The remote calls `apiBaseUrl/api/v1/insights/...`, which is the shell's proxy that adds the token from the HttpOnly cookie.

Standalone (`pnpm --filter @mfe/insights dev`, port 4104, page at `/insights/vendors`): copy `.env.secret.example` to `.env.secret` and put an access token in it. The dev server proxies `/api/v1` to `INSIGHTS_API_URL` and adds the token. Without it the API answers 401.

## Configuration

Host, port, public origin, allowed CORS origins and the API URL (standalone only) come from `.env` and `.env.local` through `env.ts`. If you change the port, update the shell's manifest URL too.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for details.
