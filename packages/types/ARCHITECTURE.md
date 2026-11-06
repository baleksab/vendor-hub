# Architecture: `@vendor-hub/types`

The API contract for the frontend: TypeScript types generated from the server's OpenAPI document. Types only, no runtime code.

The name uses the `@vendor-hub/` prefix on purpose. This package is the shared API contract, not part of the microfrontend setup, so it does not use `@mfe/`.

## Data flow

```
Zod schemas -> @fastify/swagger -> GET /swagger/schema.json -> openapi-typescript -> @vendor-hub/types -> shell
 (server)       (OpenAPI 3.1)       (running server)             scripts/generate-types   generated file    devDependency
```

## Layout

```
packages/types/
├── scripts/generate-types.ts   fetches the document, runs openapi-typescript, writes the file
├── src/
│   ├── index.ts                export type * from the generated file, plus aliases for the schemas the apps use (LoginRequest, UserResponse, CartQuoteResponse, OrderResponse, OrderStatus, OrderAction, ...) and a few hand-written, framework-agnostic types (`Locale`, `UserAdministratorProps`, `VendorAdministratorProps`)
│   └── generated/schema.gen.ts GENERATED and committed, never edited by hand
├── env.ts                      OPENAPI_URL, validated (throws on a missing key)
├── .env / .env.local
├── tsconfig.json               typecheck only
└── .oxlintrc.json              ignores src/generated
```

## Generation

`pnpm types:generate` needs a running server (`pnpm server:dev`). The script reads the URL from env, converts the document with the `openapi-typescript` Node API and writes to a temporary file that is then renamed, so a server that is down or returns garbage never leaves a truncated file. It exits non-zero with a message that names the URL. `--check` (`types:check`) regenerates in memory and fails if the committed file differs.

The output is committed, so `pnpm check` and CI work without the server. `types:check` is a manual step before a PR that touches the API.

## No build step

`exports` points straight at `src/index.ts`. Consumers use `import type`, so bundlers never load the file and nothing ends up in a bundle.

## TypeScript 5

`openapi-typescript` uses the JS compiler API, which TypeScript 7 does not have. The package therefore uses the `generator` catalog (`catalogs.generator.typescript` in `pnpm-workspace.yaml`, TypeScript 5), and pnpm resolves the peer dependency of `openapi-typescript` to it. The rest of the workspace stays on TypeScript 7.

## Ports

`OPENAPI_URL` contains the server's origin. If the server port changes, edit it in `packages/server/.env.local` and here.
