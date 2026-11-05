# @mfe/remote-test

A small test remote for the shell. Vite + React, exposed through Module Federation 2. It is client-only and exists to verify the microfrontend setup before the real remotes (admin panel, statistics) are added.

## Stack

React 19, Vite, Mantine, Tailwind, `@module-federation/vite`.

## Scripts

Run from the repo root with `pnpm --filter @mfe/remote-test <script>`, or `pnpm dev` to start it together with the shell.

| Script      | What it does                               |
| ----------- | ------------------------------------------ |
| `dev`       | standalone dev server                      |
| `build`     | production build, emits `mf-manifest.json` |
| `preview`   | serves the build (how the shell loads it)  |
| `typecheck` | `tsc --noEmit`                             |

## Usage

The shell loads `remote-test/Widget` from the manifest at runtime. Run standalone, the package renders the same widget in its own `MantineProvider`.

## Configuration

Host, port, public origin and allowed CORS origins come from `.env` and `.env.local` through `env.ts`. If you change the port, update the shell's manifest URL too.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for details.
