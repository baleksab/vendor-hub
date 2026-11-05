# @vendor-hub/api-client

Shared typed fetch client for the Vendor Hub API. A thin layer over `openapi-fetch` with a 10 second timeout, `unwrap` and `ApiError`. Used by the shell server and by remotes in the browser.

## Usage

```ts
import { createApiClient, unwrap } from "@vendor-hub/api-client";

const client = createApiClient({ baseUrl });
const users = await unwrap(client.GET("/api/v1/users"));
```

`unwrap` returns the data or throws an `ApiError` (`status`, `kind`, `title`, `detail`, `fieldErrors`), also for network failures.

## Scripts

Run with `pnpm --filter @vendor-hub/api-client <script>`.

| Script      | What it does   |
| ----------- | -------------- |
| `test`      | Vitest, once   |
| `typecheck` | `tsc --noEmit` |

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for details.
