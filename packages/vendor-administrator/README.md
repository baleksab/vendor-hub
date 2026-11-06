# @mfe/vendor-administrator

Remote with the vendor management pages: a table of the vendors the user can manage with search, relation filter, sorting and pagination (`/manage/vendors`, the filters live in the URL), a quick view drawer, and a detail page with edit, members and delete (`/manage/vendors/:id`). Administrators see every vendor, everybody else sees the vendors they own or operate. Vite + React, exposed through Module Federation 2, client-only.

## Stack

React 19, React Router (routes inside the remote), TanStack Query, `@mantine/form`, Mantine, `@vendor-hub/api-client`, `@vendor-hub/ui`.

## Scripts

Run from the repo root with `pnpm --filter @mfe/vendor-administrator <script>`, or `pnpm dev` to start it together with the shell.

| Script      | What it does                               |
| ----------- | ------------------------------------------ |
| `dev`       | standalone dev server                      |
| `build`     | production build, emits `mf-manifest.json` |
| `preview`   | serves the build (how the shell loads it)  |
| `typecheck` | `tsc --noEmit`                             |

## Usage

The shell loads `vendor-administrator/VendorAdministrator` at `/manage/*` and passes `locale`, `apiBaseUrl` and `onUnauthorized`. The remote calls `apiBaseUrl/api/v1/vendors/...`, which is the shell's proxy that adds the token from the HttpOnly cookie.

Standalone (`pnpm --filter @mfe/vendor-administrator dev`, port 4103, page at `/manage/vendors`): copy `.env.secret.example` to `.env.secret` and put an access token in it. The dev server proxies `/api/v1` to `VENDOR_ADMINISTRATOR_API_URL` and adds the token. Without it the API answers 401.

## Configuration

Host, port, public origin, allowed CORS origins and the API URL (standalone only) come from `.env` and `.env.local` through `env.ts`. If you change the port, update the shell's manifest URL too.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for details.
