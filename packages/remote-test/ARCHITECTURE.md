# Architecture: `@mfe/remote-test`

A small test remote. Vite + React, exposed through Module Federation 2 (`@module-federation/vite`). It is client-only: it is never rendered on the server.

## Layout

```
packages/remote-test/
├── src/
│   ├── Widget.tsx   the exposed component
│   ├── main.tsx     standalone entry: MantineProvider + Mantine CSS + Widget
│   └── index.css    layer order, Tailwind entry
├── index.html       standalone page
├── env.ts           typed, validated env (throws on a missing key)
├── vite.config.ts   federation + Tailwind + React, server/preview from env
├── .env / .env.local
└── tsconfig.json
```

## What it exposes

`vite.config.ts` configures `federation()` with `name: "remote-test"`, `filename: "remoteEntry.js"`, `manifest: true` and `exposes: { "./Widget": "./src/Widget.tsx" }`. The shell loads it as `remote-test/Widget` from `mf-manifest.json`.

`react`, `react-dom`, `@mantine/core` and `@mantine/hooks` are `singleton` shared modules, so when embedded the remote uses the shell's React and Mantine, including its `MantineProvider`. The build still contains a fallback copy of Mantine, but it is not downloaded when the shell provides one.

## Two ways to run

- **Embedded:** the shell loads `Widget` after hydration. `Widget` uses Mantine components and relies on the shell's provider and CSS.
- **Standalone:** `pnpm dev` serves `index.html`, and `src/main.tsx` renders `Widget` into `#root` inside its own `MantineProvider`, with Mantine CSS imported there. This is for developing the remote on its own.

In production the remote is served with `vite preview`.

## Configuration and CORS

`env.ts` (`loadRemoteEnv`) reads host, port, public origin and allowed origins. `base` is set to the public origin so asset URLs in the manifest are absolute and resolve from the shell's page. CORS on dev and preview servers allows only the origins from `REMOTE_TEST_ALLOWED_ORIGINS` (the shell's origin). Changing the port means editing this package's `.env.local` and the shell's.

## Rules specific to this package

- `react` and `react-dom` stay `singleton` in `shared`.
- Keep the exposed component free of anything that needs the server.
- A non-React remote would have its own lint plugins and dependencies; it should not inherit React things from the root.
