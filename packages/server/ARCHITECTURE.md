# Architecture: `@mfe/server`

A REST API in Node 24 + TypeScript on Fastify 5. `fastify-type-provider-zod` makes one Zod schema the source for validation, the handler's TypeScript types and the serialized response. It has users, vendors and login modules and Postgres through Drizzle.

## Layout

```
packages/server/
├── src/
│   ├── main.ts               reads env, creates the DB pool, builds the app, listens, closes on SIGINT/SIGTERM
│   ├── app.ts                buildApp(): composition root, Zod compilers, problem handler, Swagger, routes
│   ├── v1.ts                 /api/v1: public scope (create user, login, countries, vendor by slug) and protected scope (authenticate hook)
│   ├── shared/               errors, problem+json handler, pagination, countries
│   ├── db/                   client, base-entity, schema, migrate, seed-admin, migrations/
│   ├── users/                schemas, controller, service, repository, mapper, user types, role
│   ├── auth/                 schemas, controller, service, password + token services, authenticate
│   ├── vendors/              schemas, controller, service, repository, mapper, vendor types, reserved slugs
│   ├── countries/            GET /api/v1/countries (public, supported country codes)
│   ├── health/               GET /health (pings the DB)
│   ├── swagger/              Swagger UI at /docs, GET /swagger/schema.json
│   └── testing/              in-memory users and vendors repositories, buildTestApp(), test database helper
├── env.ts                    typed, validated env (throws on a missing key)
├── drizzle.config.ts
├── vitest.config.ts          unit tests
├── vitest.e2e.config.ts      integration tests (Postgres)
├── tsconfig.json             editor + typecheck, includes tests
├── tsconfig.build.json       emits to dist, src only, no tests
├── .env / .env.local / .env.secret.example (.env.secret is gitignored)
└── .oxlintrc.json
```

## Runtime

`main.ts` loads env with `loadServerEnv()`, opens a `pg` pool, builds the app and listens on `SERVER_HOST:SERVER_PORT`. In dev, Node loads `.env`, `.env.local` and `.env.secret` with `--env-file` and runs the `.ts` sources directly (`node --watch`). `buildApp()` takes options (JWT config, a `UsersRepository`, a `VendorsRepository`, a database check), not env, so tests build the app with an in-memory repository and no env files.

## Modules and layering

controller -> service -> repository, constructor injection, wired by hand in `app.ts`. Controllers validate and shape HTTP, services hold rules and throw `AppError` subclasses, repositories talk to Drizzle. The mapper `toUserResponse` is the only place that decides which user fields are public.

- **users** owns the `users` table. Registration (`POST /api/v1/users`) always creates a `regular` user. Get, list and `PATCH` need a valid token but have no role checks yet. `GET /api/v1/users/me` returns the user from the token (`request.auth.userId`) and is registered before `/users/:id`.
- **vendors** owns the `vendors` and `vendor_members` tables. `POST /api/v1/vendors` registers a vendor and its owner member in one transaction. A user owns at most one vendor, which partial unique indexes guarantee (one `owner` row per user, one per vendor, one membership per user and vendor, slug unique on `lower(slug)`), and the service checks first only to give a clear `409`. The owner adds operators by email and removes them through `/vendors/me/operators`. Only the owner can do that, so there is no role-based check and `requireRole` is not needed. `GET /vendors/me` returns the owned vendor and the vendors the caller operates. `GET /vendors` is public and paginated (`limit`, `offset`, newest first) and returns slug, name and description, for the vendor list page. `GET /vendors/by-slug/:slug` is public and returns the name, description and members as first name, last name and role, never email, phone or address. Reserved slugs (`vendors/reserved-slugs.ts`) are rejected by the request schema with `400`, and the slug never changes because it is part of the vendor URL.
- **countries** has one public route, `GET /api/v1/countries`, that returns `COUNTRY_CODES` from `shared/countries.ts`, the same list `CreateUserRequest` validates against, so clients can fill a select without a copy of the list.
- **auth** has one route, `POST /api/v1/auth` (login). It reads credentials through the narrow `UserCredentialsLookup`, implemented by the users repository. Wrong email and wrong password give the same `401`, and an unknown email still runs one argon2 verify.
- **Tokens:** `jose`, HS256 pinned on verify, claims `sub`, `role`, `iat`, `exp`, stateless guard (no DB hit), no refresh tokens. `authenticate` sets a typed `request.auth`.
- **Errors:** one global handler returns RFC 9457 `application/problem+json`. Validation errors add an `errors: [{ path, message }]` array.

## Database

Postgres 18 in Docker (root `docker-compose.yml`). The Drizzle schema in `src/db/schema.ts` is the source of truth and `drizzle-kit generate` writes SQL to `src/db/migrations/` (committed). `db:migrate` applies them, the server never migrates on startup. Every table spreads `baseEntity` (`id`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`, with a check that the flag and the timestamp agree). Rows are soft-deleted, every query goes through `notDeleted()`, and unique indexes are partial so a deleted user frees their email. `db:seed-admin` creates the first administrator from `ADMIN_*` env keys (idempotent).

## TypeScript setup

`tsconfig.base.json` is browser-oriented, so this package overrides `lib` (no DOM), `jsx`, `module` and `moduleResolution` (`NodeNext`), and turns on `erasableSyntaxOnly`. The build config enables emit with `rewriteRelativeImportExtensions`, so `./x.ts` imports become `./x.js` in `dist`. Output lands in `dist/src/main.js` because `env.ts` sits outside `src`.

## OpenAPI

`@fastify/swagger` is registered in `buildApp()` before the routes, with `jsonSchemaTransform` and `jsonSchemaTransformObject` from `fastify-type-provider-zod`, so the Zod schemas of every route become an OpenAPI 3.1 document. `swagger.controller.ts` serves it as JSON at `GET /swagger/schema.json` and Swagger UI (`@fastify/swagger-ui`) at `/docs`. Both are operational like `/health`: not versioned (everything else lives under `/api/v1`) and hidden from the document itself. `@vendor-hub/types` generates its types from the JSON endpoint.

## Testing

Vitest is the runner and Fastify's `app.inject()` sends requests straight into the app, so no port is opened and no HTTP client is needed. Unit tests are co-located with the code and use an in-memory repository. Integration tests (`*.e2e.test.ts`, `pnpm --filter @mfe/server test:e2e`) run against a separate `<DB_NAME>_test` database in Postgres and are not part of `pnpm test`.

## Not part of `pnpm dev`

The server is started on its own with `pnpm server:dev` from the root, so the frontend runs without the backend. `pnpm build`, `typecheck`, `check` and `test` include it.
