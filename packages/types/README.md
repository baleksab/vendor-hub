# @vendor-hub/types

TypeScript types for the API, generated from the server's OpenAPI document. Types only, no runtime code and no build step. Besides the generated API types it holds a few hand-written, framework-agnostic types shared by the shell and remotes (`Locale`, `UserAdministratorProps`).

## Usage

```ts
import type { components } from "@vendor-hub/types";
```

Always use `import type`, so nothing from this package ends up in a bundle.

## Scripts

Run with `pnpm --filter @vendor-hub/types <script>`. `pnpm types:generate` from the repo root does the same as `types:generate` here.

| Script           | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `types:generate` | fetches the OpenAPI document and rewrites the types |
| `types:check`    | fails if the committed file is out of date          |
| `typecheck`      | `tsc --noEmit`                                      |

Generation needs a running server (`pnpm server:dev`). The generated file in `src/generated` is committed and never edited by hand. Regenerate it after every API change.

## Configuration

`OPENAPI_URL` comes from `.env` and `.env.local` through `env.ts`. If the server port changes, update it here as well.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for details.
