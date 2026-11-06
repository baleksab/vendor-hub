# Vendor Hub

A multi-vendor online store platform. Every vendor gets its own storefront under a reserved path (`vendorhub.localhost/vendors/<vendor>` locally). Public pages (landing page, storefronts, catalog, product pages) are rendered on the server. The tools for running a store (vendor admin panel, statistics) are microfrontends, built separately and loaded into the shell in the browser.

Course project: _Odabrana poglavlja iz projektovanja poslovnih aplikacija_ (2026/27). Chosen base: **online store** (catalog, cart, order, payment, delivery, return).

## Idea

One platform, many independent stores:

- A **customer** browses vendors and products, fills a cart, places an order and pays (simulated).
- A **vendor** manages its own catalog, orders and returns in an admin panel and follows its sales in statistics.
- A **platform administrator** approves vendors, manages users and sees platform-wide numbers.

SSR serves the public side (fast first paint, SEO for storefronts and products). The admin panel and statistics sit behind a login, so they are independently built client-side modules.

## Architecture

```
 vendorhub.localhost ──► nginx ──┬──► shell (SSR)        pages
                                    ├──► remotes            admin, statistics
                                    └──► server (REST API) ──► PostgreSQL
```

| Part    | Package                         | Role                                                          |
| ------- | ------------------------------- | ------------------------------------------------------------- |
| Shell   | `packages/shell`                | SSR host: landing page, storefronts, checkout, loads remotes  |
| Remotes | `packages/remote-*`             | Vendor admin panel and statistics (Module Federation, client) |
| API     | `packages/server`               | REST API and business rules (Fastify, Zod, Postgres)          |
| Types   | `packages/types`                | API types generated from the server's OpenAPI document        |
| Client  | `packages/api-client`           | Shared typed fetch client (`openapi-fetch`) and `ApiError`    |
| UI      | `packages/ui`                   | Shared Mantine theme, design tokens and common components     |
| Admin   | `packages/user-administrator`   | Remote with the user administration pages                     |
| Manage  | `packages/vendor-administrator` | Remote with the vendor management pages                       |
| Proxy   | nginx                           | Reverse proxy in front of the shell                           |

Each vendor owns a path (`/vendors/<slug>`), and `/vendors` lists them all. Everything is served from one domain, so adding a vendor never changes the nginx config. The domain is configuration, like every other host and port.

Details: [`ARCHITECTURE.md`](ARCHITECTURE.md) and the `ARCHITECTURE.md` of each package.

## Getting started

Requirements: Node 24 (`.nvmrc`), the pnpm version from `packageManager`, and Docker.

### Everything in Docker

```sh
cp packages/server/.env.secret.example packages/server/.env.secret
# fill in the secrets, they are never committed

pnpm stack:deploy
```

The script (`scripts/deploy.sh`) checks Docker and the secrets file, builds the images, starts Postgres, applies the migrations, seeds the administrator, then starts the server, the shell, the remote and nginx, and waits until all of them are healthy. Then open `http://vendorhub.localhost`. `pnpm stack:down` stops everything. It runs as its own compose project (`vendor-hub-stack`), separate from the containers of `pnpm db:up` and `pnpm nginx:up`, so stop `pnpm nginx:up` first (nginx needs port 80). The deploy does not publish Postgres on the host. Uploaded product images live in the `product-images` volume.

### Development

```sh
pnpm install

cp packages/server/.env.secret.example packages/server/.env.secret
# fill in the secrets, they are never committed

pnpm db:up
pnpm --filter @mfe/server db:migrate
pnpm --filter @mfe/server db:seed-admin

pnpm server:dev     # API
pnpm dev            # shell and remotes
pnpm nginx:up       # nginx on port 80, open http://vendorhub.localhost
```

`*.localhost` resolves to `127.0.0.1` in Chrome, Firefox and Safari, so no hosts file or DNS setup is needed.

nginx (`infra/nginx`) sends `vendorhub.localhost` to the shell. `pnpm nginx:down` stops it. Its settings are in `infra/nginx/.env.local`; changing the domain or port also means changing `SHELL_ORIGIN` (shell) and `REMOTE_TEST_ALLOWED_ORIGINS` and `USER_ADMINISTRATOR_ALLOWED_ORIGINS` and `VENDOR_ADMINISTRATOR_ALLOWED_ORIGINS` (remotes). nginx is optional: without it the shell is also reachable on `localhost:4100`.

| Service             | URL                                                             |
| ------------------- | --------------------------------------------------------------- |
| Shell               | `http://vendorhub.localhost` (nginx), upstream `localhost:4100` |
| Vendor site         | `http://vendorhub.localhost/vendors/<slug>` (nginx)             |
| Remote (user admin) | `http://localhost:4102`                                         |
| Remote (vendors)    | `http://localhost:4103`                                         |
| Admin pages         | `http://vendorhub.localhost/admin/users` (administrators only)  |
| Vendor management   | `http://vendorhub.localhost/manage/vendors` (logged in)         |
| API                 | `http://localhost:4200` (docs `/docs`)                          |
| Postgres            | `localhost:5433`                                                |

Ports are changed only in the `.env.local` files. The shell needs the API running for login and registration, so start `pnpm server:dev` first (the shell's `API_URL` points at it).

| Command                              | What it does                     |
| ------------------------------------ | -------------------------------- |
| `pnpm check`                         | lint + typecheck + build         |
| `pnpm test`                          | unit tests                       |
| `pnpm --filter @mfe/server test:e2e` | API integration tests (Postgres) |
| `pnpm format`                        | format with oxfmt                |

## Test users

> Only the administrator exists today, created from the `ADMIN_*` keys of the server env. Vendor and customer users come with their roles.

| Role       | Email              | Password              |
| ---------- | ------------------ | --------------------- |
| `admin`    | from `ADMIN_EMAIL` | from `ADMIN_PASSWORD` |
| `vendor`   | _to be added_      | _to be added_         |
| `customer` | _to be added_      | _to be added_         |

## Project status

| Area                                   | State                       |
| -------------------------------------- | --------------------------- |
| Monorepo, SSR shell, Module Federation | done (user administration)  |
| API server, OpenAPI, users and login   | done                        |
| Shell login, registration, session     | done                        |
| Vendors, roles, vendor pages           | in progress (server, shell) |
| Catalog, cart, orders, payment         | planned                     |
| Admin and statistics remotes, reports  | planned                     |
| Full-stack Docker deploy               | done (`pnpm stack:deploy`)  |
| Specialist track                       | undecided                   |

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md): monorepo architecture
- [`CONTRIBUTING.md`](CONTRIBUTING.md): workflow, commits, PRs, project rules
- Per package: `packages/*/README.md` and `packages/*/ARCHITECTURE.md`
