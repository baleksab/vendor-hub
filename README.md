# Vendor Hub

A multi-vendor online store platform. Every vendor gets its own storefront on a reserved subdomain (`<vendor>.vendor-hub.localhost` locally). Public pages (landing page, storefronts, catalog, product pages) are rendered on the server. The tools for running a store (vendor admin panel, statistics) are microfrontends, built separately and loaded into the shell in the browser.

Course project: _Odabrana poglavlja iz projektovanja poslovnih aplikacija_ (2026/27). Chosen base: **online store** (catalog, cart, order, payment, delivery, return).

## Idea

One platform, many independent stores:

- A **customer** browses vendors and products, fills a cart, places an order and pays (simulated).
- A **vendor** manages its own catalog, orders and returns in an admin panel and follows its sales in statistics.
- A **platform administrator** approves vendors, manages users and sees platform-wide numbers.

SSR serves the public side (fast first paint, SEO for storefronts and products). The admin panel and statistics sit behind a login, so they are independently built client-side modules.

## Architecture

```
 *.vendor-hub.localhost ──► nginx ──┬──► shell (SSR)        pages
                                    ├──► remotes            admin, statistics
                                    └──► server (REST API) ──► PostgreSQL
```

| Part    | Package             | Role                                                          |
| ------- | ------------------- | ------------------------------------------------------------- |
| Shell   | `packages/shell`    | SSR host: landing page, storefronts, checkout, loads remotes  |
| Remotes | `packages/remote-*` | Vendor admin panel and statistics (Module Federation, client) |
| API     | `packages/server`   | REST API and business rules (Fastify, Zod, Postgres)          |
| Types   | `packages/types`    | API types generated from the server's OpenAPI document        |
| Proxy   | nginx               | Wildcard subdomain routing in front of everything             |

Each vendor owns a subdomain, and the bare domain serves the landing page and vendor directory. nginx routes by wildcard, so adding a vendor never changes its config. The base domain is configuration, like every other host and port.

Details: [`ARCHITECTURE.md`](ARCHITECTURE.md) and the `ARCHITECTURE.md` of each package.

## Getting started

Requirements: Node 24 (`.nvmrc`), the pnpm version from `packageManager`, and Docker.

### Everything in Docker

> Planned. Today the compose file only starts Postgres.

```sh
docker compose up
```

Then open `http://vendor-hub.localhost`.

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
```

| Service       | URL                                    |
| ------------- | -------------------------------------- |
| Shell         | `http://localhost:4100`                |
| Remote (test) | `http://localhost:4101`                |
| API           | `http://localhost:4200` (docs `/docs`) |
| Postgres      | `localhost:5433`                       |

Ports are changed only in the `.env.local` files.

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

| Area                                   | State                   |
| -------------------------------------- | ----------------------- |
| Monorepo, SSR shell, Module Federation | done (test remote only) |
| API server, OpenAPI, users and login   | done                    |
| Vendors, roles, subdomain routing      | planned                 |
| Catalog, cart, orders, payment         | planned                 |
| Admin and statistics remotes, reports  | planned                 |
| Full-stack `docker compose up`         | planned                 |
| Specialist track                       | undecided               |

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md): monorepo architecture
- [`CONTRIBUTING.md`](CONTRIBUTING.md): workflow, commits, PRs, project rules
- Per package: `packages/*/README.md` and `packages/*/ARCHITECTURE.md`
