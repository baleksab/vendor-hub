# @mfe/shell

The host application of Vendor Hub. React Router 8 in framework mode with SSR, built with Vite. It renders the public pages on the server and loads microfrontends (remotes) in the browser through Module Federation.

## Stack

React 19, React Router 8, Mantine, Tailwind, `@module-federation/runtime`, Vitest.

## Scripts

Run from the repo root with `pnpm --filter @mfe/shell <script>`, or `pnpm dev` to start the shell together with the remotes.

| Script      | What it does                   |
| ----------- | ------------------------------ |
| `dev`       | dev server with HMR            |
| `build`     | production build into `build/` |
| `start`     | serves the built app           |
| `typecheck` | route typegen + `tsc --noEmit` |
| `test`      | unit tests                     |

## Configuration

Hosts, ports and URLs come from `.env` and `.env.local` through `env.ts`, which throws on a missing key. Change the port only in `.env.local`.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the structure, localization and how remotes are loaded.
