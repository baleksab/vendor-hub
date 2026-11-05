# @mfe/server

The REST API of Vendor Hub. Fastify 5 with Zod schemas as the single source for validation, types and the OpenAPI document. Data is stored in Postgres through Drizzle.

## Stack

Node 24, TypeScript, Fastify, Zod, Drizzle, Postgres 18, `jose` (JWT), argon2, Vitest.

## Getting started

```sh
cp .env.secret.example .env.secret   # fill in the secrets

pnpm db:up                           # from the repo root, starts Postgres
pnpm --filter @mfe/server db:migrate
pnpm --filter @mfe/server db:seed-admin

pnpm server:dev
```

Swagger UI is at `/docs`, the OpenAPI document at `/swagger/schema.json`, and the API under `/api/v1`.

## Scripts

Run with `pnpm --filter @mfe/server <script>`.

| Script          | What it does                                |
| --------------- | ------------------------------------------- |
| `dev`           | API with watch mode                         |
| `build`         | compiles to `dist/`                         |
| `start`         | runs the build                              |
| `db:generate`   | generates a migration from the schema       |
| `db:migrate`    | applies migrations                          |
| `db:seed-admin` | creates the first admin from `ADMIN_*` keys |
| `typecheck`     | `tsc --noEmit`                              |
| `test`          | unit tests                                  |
| `test:e2e`      | integration tests (needs Postgres)          |

## Configuration

Values come from `.env`, `.env.local` and the gitignored `.env.secret` through `env.ts`, which throws on a missing key. Secrets never go into committed files.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for modules, auth, the database and testing.
