# Architecture: `@vendor-hub/api-client`

The one fetch layer of the frontend. No build step: `exports` points at `src/index.ts` and consumers bundle it.

## Layout

```
packages/api-client/
├── src/
│   ├── createApiClient.ts   openapi-fetch client with a timeout, `unwrap`, REQUEST_TIMEOUT_MS
│   ├── ApiError.ts          ApiError, kinds, fromResponse, networkError
│   ├── problem.ts           Zod schema of application/problem+json
│   └── index.ts             public exports
├── vitest.config.ts
└── tsconfig.json
```

## Behavior

- `createApiClient<Paths>(options)` defaults to the `paths` of `@vendor-hub/types`, so a wrong path, method or body is a `tsc` error. The base URL is always passed by the caller (no env here).
- `unwrap` turns every failed call into an `ApiError`: `validation` (400, with `fieldErrors` keyed by path), `unauthorized` (401), `conflict` (409), `client`, `server` and `network` (status 0).
- `@vendor-hub/types` is a devDependency used for types only. `openapi-fetch` and `zod` are runtime dependencies.
