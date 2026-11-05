# @mfe/user-administrator

Remote with the administrator pages for user management: a list (`/admin/users`) and a detail/edit page (`/admin/users/:id`). Vite + React, exposed through Module Federation 2, client-only.

## Stack

React 19, React Router (routes inside the remote), TanStack Query, `@mantine/form`, Mantine, `@vendor-hub/api-client`, `@vendor-hub/ui`.

## Scripts

Run from the repo root with `pnpm --filter @mfe/user-administrator <script>`, or `pnpm dev` to start it together with the shell.

| Script      | What it does                               |
| ----------- | ------------------------------------------ |
| `dev`       | standalone dev server                      |
| `build`     | production build, emits `mf-manifest.json` |
| `preview`   | serves the build (how the shell loads it)  |
| `typecheck` | `tsc --noEmit`                             |

## Usage

The shell loads `user-administrator/UserAdministrator` at `/admin/*` and passes `locale`, `apiBaseUrl` and `onUnauthorized`. The remote calls `apiBaseUrl/api/v1/users`, which is the shell's proxy that adds the token from the HttpOnly cookie.

Standalone (`pnpm --filter @mfe/user-administrator dev`, port 4102, page at `/admin/users`): copy `.env.secret.example` to `.env.secret` and put an administrator's access token in it. The dev server proxies `/api/v1` to `USER_ADMINISTRATOR_API_URL` and adds the token. Without it the API answers 401.

## Configuration

Host, port, public origin, allowed CORS origins and the API URL (standalone only) come from `.env` and `.env.local` through `env.ts`. If you change the port, update the shell's manifest URL too.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for details.
