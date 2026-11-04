# Architecture: `@mfe/server`

A REST API in Node 24 + TypeScript on Fastify 5. `fastify-type-provider-zod` makes one Zod schema the source for validation, the handler's TypeScript types and the serialized response. So far it has only the skeleton and `GET /health`. Users, auth and Postgres are not implemented yet.

## Layout

```
packages/server/
├── src/
│   ├── main.ts               reads env, builds the app, listens, closes on SIGINT/SIGTERM
│   ├── app.ts                buildApp(): composition root, Zod compilers, registers routes
│   ├── swagger/
│   │   ├── swagger.controller.ts  Swagger UI at /docs, GET /swagger/schema.json
│   │   └── swagger.test.ts
│   └── health/
│       ├── health.schemas.ts     HealthResponse (Zod) + inferred type
│       ├── health.controller.ts  GET /health
│       └── health.test.ts        Vitest + app.inject()
├── env.ts                    typed, validated env (throws on a missing key)
├── vitest.config.ts
├── tsconfig.json             editor + typecheck, includes tests
├── tsconfig.build.json       emits to dist, src only, no tests
├── .env / .env.local
└── .oxlintrc.json
```

## Runtime

`main.ts` loads env with `loadServerEnv()`, calls `buildApp()` and listens on `SERVER_HOST:SERVER_PORT`. In dev, Node loads `.env` and `.env.local` with `--env-file` and runs the `.ts` sources directly (`node --watch`), with no extra runner. `buildApp()` takes only options (no env), so tests can build the app without any env files.

## TypeScript setup

`tsconfig.base.json` is browser-oriented, so this package overrides `lib` (no DOM), `jsx`, `module` and `moduleResolution` (`NodeNext`), and turns on `erasableSyntaxOnly`. The build config enables emit with `rewriteRelativeImportExtensions`, so `./x.ts` imports become `./x.js` in `dist`. Output lands in `dist/src/main.js` because `env.ts` sits outside `src`.

## OpenAPI

`@fastify/swagger` is registered in `buildApp()` before the routes, with `jsonSchemaTransform` and `jsonSchemaTransformObject` from `fastify-type-provider-zod`, so the Zod schemas of every route become an OpenAPI 3.1 document. `swagger.controller.ts` serves it as JSON at `GET /swagger/schema.json` and Swagger UI (`@fastify/swagger-ui`) at `/docs`. Both are operational like `/health`: not versioned and hidden from the document itself. `@vendor-hub/types` generates its types from the JSON endpoint.

## Testing

Vitest is the runner and Fastify's `app.inject()` sends requests straight into the app, so no port is opened and no HTTP client is needed. Tests are co-located with the code.

## Not part of `pnpm dev`

The server is started on its own with `pnpm server:dev` from the root, so the frontend runs without the backend. `pnpm build`, `typecheck`, `check` and `test` include it.
