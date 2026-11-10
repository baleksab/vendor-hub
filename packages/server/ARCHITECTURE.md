# Architecture: `@mfe/server`

A REST API in Node 24 + TypeScript on Fastify 5. `fastify-type-provider-zod` makes one Zod schema the source for validation, the handler's TypeScript types and the serialized response. It has users, vendors, products, reviews and login modules and Postgres through Drizzle.

## Layout

```
packages/server/
├── src/
│   ├── main.ts               reads env, creates the DB pool, builds the app, listens, closes on SIGINT/SIGTERM
│   ├── app.ts                buildApp(): composition root, Zod compilers, problem handler, Swagger, routes
│   ├── v1.ts                 /api/v1: public scope (create user, login, countries, vendor by slug) and protected scope (authenticate hook)
│   ├── shared/               errors (incl. ForbiddenError), problem+json handler, pagination, countries
│   ├── db/                   client, base-entity, schema, migrate, seed-admin, migrations/
│   ├── users/                schemas, controller, service, repository, mapper, user types, role
│   ├── auth/                 schemas, controller, service, password + token services, authenticate, require-role
│   ├── vendors/              schemas, controller, service, repository, mapper, vendor types, reserved slugs
│   ├── categories/           the hardcoded two-level category tree and GET /api/v1/categories
│   ├── products/             products, search, images (multipart upload, magic bytes check, ImageStorage), currencies
│   ├── reviews/              product and vendor reviews (rating + comment), rating aggregates
│   ├── cart/                 POST /api/v1/cart/quote (public), CartService.quote
│   ├── orders/               order-state (status machine), schemas, controller, service, repository, mapper, order-scheduler
│   ├── insights/             read-only vendor and product analytics (membership-only access, SQL aggregates, periods and currency)
│   ├── payments/             PaymentGateway interface, SimulatedPaymentGateway and test cards, payment enums
│   ├── countries/            GET /api/v1/countries (public, supported country codes)
│   ├── health/               GET /health (pings the DB)
│   ├── swagger/              Swagger UI at /docs, GET /swagger/schema.json
│   └── testing/              in-memory repositories and image storage, buildTestApp() (with a TestClock), order fixtures, test database helper
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

- **users** owns the `users` table. Registration (`POST /api/v1/users`) always creates a `regular` user. `GET /api/v1/users` (paginated, newest first by default, sortable with `sort` (`name`, `role`, `country`, `createdAt`) and `order`, with optional `search` over email and name, `role` and `country` filters), `GET /api/v1/users/:id` and `PATCH /api/v1/users/:id` are administrator-only (`requireRole("administrator")`, `403` otherwise). `PATCH` takes any subset of the fields, including `role` and `password` (hashed before it is stored), and an omitted field stays as it is. An administrator cannot change their own `role` (`400`), so the system cannot lose its last administrator by accident. `GET /api/v1/users/me` returns the user from the token (`request.auth.userId`) and is registered before `/users/:id`.
- **vendors** owns the `vendors` and `vendor_members` tables. `POST /api/v1/vendors` registers a vendor and its owner member in one transaction. A user owns at most one vendor, which partial unique indexes guarantee (one `owner` row per user, one per vendor, one membership per user and vendor, slug unique on `lower(slug)`), and the service checks first only to give a clear `409`. The owner adds operators by email and removes them through `/vendors/me/operators`. Only the owner can do that, so there is no role-based check. `GET /vendors/me` returns the owned vendor and the vendors the caller operates. `GET /vendors` is public and paginated (`limit`, `offset`) with `search` (name, slug or description), `category` (a leaf or a top-level category, which matches its children), `minRating` and `sort` (`newest` by default, `name`, `rating`, `productCount`). It returns slug, name, description, `ratingAvg`, `ratingCount`, `productCount` and the distinct product `categories` of each vendor (live products only, from one grouped subquery), for the vendor list page. `GET /vendors/by-slug/:slug` is public and returns the name, description and members as first name, last name and role, never email, phone or address. Management by id is protected and decided in one place, `vendors/vendor-access.ts` (`resolveAccess`). Administrators manage every vendor, owners and operators manage the vendors they belong to, and only administrators and owners can delete. Someone who cannot see a vendor gets `404`, an operator who tries to delete gets `403`. `GET /vendors/managed` is the paginated list (`search`, `relation`, `sort`, `order`) with the owner, the member count and the caller's `viewerRole`, `memberRole` (`owner`, `operator` or `null` for an administrator who is not a member) and `canDelete`, and the visibility filter is in the SQL. `GET`, `PATCH` and `DELETE /vendors/:id` read, edit (name, description and the SEO fields) and soft delete the vendor together with its members. `POST /vendors/:id/operators` and `DELETE /vendors/:id/operators/:userId` manage operators, and the owner can never be removed. Vendors and products carry nullable `seo_title` and `seo_description` (and products `seo_image_id`, one of the product's own images, `400` otherwise, cleared in the same transaction when that image is deleted). The shared Zod fields in `shared/seo.ts` trim and turn a blank string into `null` (limits `SEO_TITLE_MAX` 60 and `SEO_DESCRIPTION_MAX` 160), a `null` in `PATCH` is a valid update that clears the field, and the fields are public in the public responses because they end up in the page `<head>`. Empty means "use the default", the server never stores the default text. They go through the same update endpoints and the same access check as the other fields, so administrators can edit them for every vendor and product. Reserved slugs (`vendors/reserved-slugs.ts`) are rejected by the request schema with `400`, and the slug never changes because it is part of the vendor URL.
- **categories** are a constant in `categories/categories.ts` (two levels, `en` and `sr` names, no table). A product stores the slug of a leaf (or of a top level entry without children) and the Zod enum is built from the constant. Filtering by a parent includes its children. `GET /api/v1/categories` is public.
- **products** own `products` and `product_images`. Reads are public: `GET /vendors/by-slug/:slug/products` (search `q`, `category`, `minRating`, `minPrice`, `maxPrice`, `inStock`, `sort`, pagination), `GET /vendors/by-slug/:slug/product-categories` (counts that follow the filters except the category), `GET /products/:id` and `GET /product-images/:id` (immutable cache). Writes (`POST /vendors/:id/products`, `PATCH` and `DELETE /products/:id`, image upload, order and delete) need an administrator, owner or operator of the product's vendor through `resolveAccess`, anyone else gets `404`. All filters, the sort and the total are computed in the repository query. Text search is `lower(name) like` with escaped wildcards, backed by a `pg_trgm` GIN index (the migration creates the extension), and name matches rank first. Prices are `price_minor` integers plus a currency. Images are saved through the `ImageStorage` interface (`FileSystemImageStorage` in `PRODUCT_IMAGE_DIR`), the type is detected from the first bytes, and the size and count limits come from `PRODUCT_IMAGE_MAX_BYTES` and `PRODUCT_IMAGE_MAX_PER_PRODUCT` (`413`, `415`, `409`). Deleting a vendor soft deletes its products in the same transaction.
- **reviews** own `product_reviews` and `vendor_reviews` (one live review per user and target, partial unique index). `PUT /products/:id/reviews/me` and `PUT /vendors/:id/reviews/me` create or replace the caller's review, members of the vendor get `403`. The author, an administrator and members of the vendor can delete a review, others get `404`. `rating_avg` and `rating_count` on products and vendors are recomputed only in the review repository, in the transaction of the change. Responses show the author as first name and last initial, never email.
- **cart** has one public route, `POST /api/v1/cart/quote`. It takes product ids and quantities (duplicates merged, at most `CART_MAX_LINES` products, otherwise `400`) and returns a live snapshot of each line from `ProductsRepository.findManyByIds` (deleted products and products of deleted vendors are `unavailable`) with a status `ok`, `quantityReduced`, `outOfStock` or `unavailable`, totals per currency (never summed across currencies) and `canCheckout`. Order creation uses the same `CartService.quote`.
- **orders** own `orders`, `order_items`, `payments` and `order_events`. `order-state.ts` is the only place that knows the transitions: a table of action -> from -> to with the actor (`buyer`, `vendor` meaning owner, operator or administrator through `resolveAccess`, or `system`), which actions need a reason and which restore stock. The service asks it for every change, and illegal transitions are `409`.

  | Action         | From -> To                                                | Actor  |
  | -------------- | --------------------------------------------------------- | ------ |
  | pay            | created -> paid                                           | buyer  |
  | failPayment    | created -> created (attempt counted)                      | buyer  |
  | exhaustPayment | created -> cancelled (last allowed attempt failed)        | system |
  | cancel         | created -> cancelled                                      | buyer  |
  | expire         | created -> cancelled (payment TTL passed)                 | system |
  | deliver        | paid -> delivered                                         | vendor |
  | confirmReceipt | delivered -> closed                                       | buyer  |
  | autoClose      | delivered -> closed (return window passed)                | system |
  | requestReturn  | delivered -> return_requested (reason, inside the window) | buyer  |
  | approveReturn  | return_requested -> return_approved (refund)              | vendor |
  | rejectReturn   | return_requested -> return_rejected (reason)              | vendor |

  `POST /orders` quotes the lines, splits them into one order per vendor and currency and, in one transaction, decrements stock with a conditional update (`stock >= n`), inserts the orders, the item snapshots (name and unit price at order time) and a `created` event. Any line that is not `ok`, or a lost race for the last item, is a `409` whose problem body carries the fresh `quote`, and nothing is created. The idempotency key is unique per user, vendor and currency (`orders_idempotency_unique`), so a repeated request returns the orders it already created (`200` instead of `201`). The shipping details are copied into the order. Stock is restored when an order is cancelled (by the buyer, after the last failed payment or by the timeout) and when a return is approved. Buyer routes (`payments`, `cancel`, `confirm-receipt`, `return-requests`) and vendor routes (`deliver`, `returns/approve`, `returns/reject`, `GET /vendors/:id/orders`) give `404` to anyone else, and `GET /orders/:id` works for both sides. The response has `viewer` and `allowedActions`, so clients never repeat the rules. Every change is a conditional update on the current status plus an `order_events` row (actor `buyer`, `vendor` or `system`) and, for payments, a `payments` row, all in one transaction. Vendor names come from the vendor row even after it is soft deleted, so old orders stay readable.

- **payments** are simulated behind `PaymentGateway` (`charge`, `refund`). `SimulatedPaymentGateway` succeeds for `TEST_CARDS.success`, declines `TEST_CARDS.declined` and fails anything else as `unknownCard`. A failed charge is a normal `200` with `payment.status = "failed"` and the attempts left. After `ORDER_PAYMENT_MAX_ATTEMPTS` failures the order is cancelled. Only the outcome, amount and reason are stored, the card number is redacted from logs and never saved.
- **order scheduler** (`orders/order-scheduler.ts`): `buildApp` registers it only when `runOrderScheduler` is true (`main.ts`), so tests never run it. A `setInterval` job (`ORDER_SCHEDULER_INTERVAL_SECONDS`) that skips a tick while the previous one still runs starts on Fastify `onReady` and stops on `onClose`. Each tick calls `OrdersService.expireUnpaid()` and `closeElapsed()`. Each handles up to `ORDER_SCHEDULER_BATCH_SIZE` orders, every one in its own transaction: the row is picked with `FOR UPDATE SKIP LOCKED`, so parallel instances never take the same order, and a failing order is logged and skipped without stopping the rest. Reads never change state; paying after the TTL or asking for a return after the window is `409` even before the job ran. The service takes a clock, so tests move time with `TestClock`.
- **insights** is read-only and owns no table: it aggregates `orders`, `order_items`, `products` and the review tables. `GET /insights/vendors` (table with search, `relation`, sort by revenue, orders, products, rating or name), `GET /insights/vendors/:id` and `GET /insights/products/:id`, all protected. Access comes only from the caller's `vendor_members` row (`insights-access.ts`), the administrator role changes nothing: a non member, administrators included, gets `404` on by-id routes and an empty list. Revenue rules live in `revenue-statuses.ts`: paid orders are `paid`, `delivered`, `closed`, `return_requested`, `return_rejected` and `return_approved`, the last one is the refunded part, so net = gross - refunded. Buckets use `paid_at` in UTC. Money is never summed across currencies: every request has one `currency`, and when it is missing the service picks the one with the most paid orders and returns all of them in `meta.currencies`. `period` is a preset (`7d`, `30d`, `90d`, `12m`, `all`) compared with the previous period of the same length (`insights.period.ts` picks day, week or month buckets, the service fills empty buckets). The service takes the injected clock.
- **countries** has one public route, `GET /api/v1/countries`, that returns `COUNTRY_CODES` from `shared/countries.ts`, the same list `CreateUserRequest` validates against, so clients can fill a select without a copy of the list.
- **auth** has one route, `POST /api/v1/auth` (login). It reads credentials through the narrow `UserCredentialsLookup`, implemented by the users repository. Wrong email and wrong password give the same `401`, and an unknown email still runs one argon2 verify.
- **Tokens:** `jose`, HS256 pinned on verify, claims `sub`, `role`, `iat`, `exp`, stateless guard (no DB hit), no refresh tokens. `authenticate` sets a typed `request.auth`, and `requireRole(...roles)` is a route-level `onRequest` hook that throws `ForbiddenError` when `request.auth.role` is not allowed. The role comes from the token, so a demoted administrator keeps access until the token expires.
- **Errors:** one global handler returns RFC 9457 `application/problem+json`. Validation errors add an `errors: [{ path, message }]` array.

## Database

Postgres 18 in Docker (root `docker-compose.yml`). The Drizzle schema in `src/db/schema.ts` is the source of truth and `drizzle-kit generate` writes SQL to `src/db/migrations/` (committed). `db:migrate` applies them, the server never migrates on startup. Every table spreads `baseEntity` (`id`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`, with a check that the flag and the timestamp agree). Rows are soft-deleted, every query goes through `notDeleted()` (orders are never deleted, they are history), and unique indexes are partial so a deleted user frees their email. `db:seed-admin` creates the first administrator from `ADMIN_*` env keys (idempotent).

## TypeScript setup

`tsconfig.base.json` is browser-oriented, so this package overrides `lib` (no DOM), `jsx`, `module` and `moduleResolution` (`NodeNext`), and turns on `erasableSyntaxOnly`. The build config enables emit with `rewriteRelativeImportExtensions`, so `./x.ts` imports become `./x.js` in `dist`. Output lands in `dist/src/main.js` because `env.ts` sits outside `src`.

## OpenAPI

`@fastify/swagger` is registered in `buildApp()` before the routes, with `jsonSchemaTransform` and `jsonSchemaTransformObject` from `fastify-type-provider-zod`, so the Zod schemas of every route become an OpenAPI 3.1 document. `swagger.controller.ts` serves it as JSON at `GET /swagger/schema.json` and Swagger UI (`@fastify/swagger-ui`) at `/docs`. Both are operational like `/health`: not versioned (everything else lives under `/api/v1`) and hidden from the document itself. `@vendor-hub/types` generates its types from the JSON endpoint.

## Testing

Vitest is the runner and Fastify's `app.inject()` sends requests straight into the app, so no port is opened and no HTTP client is needed. Unit tests are co-located with the code and use an in-memory repository. Integration tests (`*.e2e.test.ts`, `pnpm --filter @mfe/server test:e2e`) run against a separate `<DB_NAME>_test` database in Postgres and are not part of `pnpm test`.

## Not part of `pnpm dev`

The server is started on its own with `pnpm server:dev` from the root, so the frontend runs without the backend. `pnpm build`, `typecheck`, `check` and `test` include it.
