# Architecture: `@mfe/user-administrator`

Remote for user administration. Vite + React, Module Federation 2 (`@module-federation/vite`), client-only.

## Layout

```
packages/user-administrator/
├── src/
│   ├── UserAdministrator.tsx   exposed component: contexts, lazy <Routes>, 401 handler
│   ├── main.tsx                standalone entry: BrowserRouter, ui theme, MantineProvider
│   ├── paths.ts                USERS_PATH, userPath (the remote is mounted at /admin)
│   ├── api/                    client.ts, queryKeys.ts (userKeys), users.ts (listUsers, getUser, updateUser), countries.ts (listCountries)
│   ├── hooks/                  useUsers, useUser, useUpdateUser
│   ├── context/                ApiContext (client), MessagesContext (t)
│   ├── i18n/messages.ts        en and sr texts, createT(locale)
│   └── pages/UserList, UserDetail
├── env.ts, vite.config.ts, index.html
├── .env / .env.local / .env.secret.example
└── tsconfig.json, .oxlintrc.json
```

## What it exposes

`./UserAdministrator` with the props `{ locale, apiBaseUrl, onUnauthorized }` (type `UserAdministratorProps` in `@vendor-hub/types`). It renders `<Routes>` with `users`, `users/:id` and a catch-all redirect to `users`. Both pages are `React.lazy` chunks.

`react`, `react-dom`, `react-router`, `@tanstack/react-query`, `@mantine/core` and `@mantine/hooks` are `singleton` shared modules. `react-router` must be shared so that `<Routes>`, `Link` and `useParams` use the shell's router, and its version must match the shell's. TanStack Query is shared too: the shell owns the `QueryClient` (`staleTime` 30 s, inactive queries are dropped after the default 5 min `gcTime`), so the cache survives leaving and re-entering `/admin` and is shared with the other remotes. The remote only creates its own client in standalone mode (`api/queryClient.ts`, used by `main.tsx`).

## Data

- All calls use `createApiClient` and `unwrap` from `@vendor-hub/api-client`, with `apiBaseUrl` as base URL. In the shell that is the shell origin, where the `/api/v1/*` proxy adds the token. The browser never holds the JWT.
- `queryKeys.ts` is the only place that builds query keys. Hooks never write an array literal.
- `useUnauthorizedHandler` subscribes to the query and mutation caches and calls `onUnauthorized` on `ApiError.kind === "unauthorized"`. Queries are not retried on 401, 403 and 404 (set in the shell's client).
- The list state (`q`, `role`, `country`, `size`, `page`) lives in the URL search params (`pages/UserList/filters.ts`), search is debounced, and any filter change goes back to page 1. Filtering and paging happen on the API (`search`, `role`, `country`, `limit`, `offset`). The country list comes from `GET /api/v1/countries` (cached forever) and is labelled with `Intl.DisplayNames` in the `locale`.
- `useUpdateUser` writes the response into the detail cache and invalidates the lists.
- The edit form sends only changed fields (PATCH semantics), the password only when filled. A `validation` error maps `fieldErrors` onto the fields, `conflict` lands on the email.

## Two ways to run

- **Embedded:** the shell loads the component after hydration and relies on its Mantine provider and CSS.
- **Standalone:** `main.tsx` adds the `@vendor-hub/ui` theme, `MantineProvider` and Mantine CSS, and mounts the component at `admin/*`. The Vite dev server proxies `/api/v1` to the API and adds `USER_ADMINISTRATOR_DEV_TOKEN` from the gitignored `.env.secret`.

## Rules specific to this package

- Texts live in `i18n/messages.ts`, chosen by the `locale` prop. Shared components from `@vendor-hub/ui` get their texts as props.
- Mantine CSS and the theme are imported only in `main.tsx`.
- CORS on dev and preview allows only `USER_ADMINISTRATOR_ALLOWED_ORIGINS` (the shell origin), for loading the remote's own JS.
