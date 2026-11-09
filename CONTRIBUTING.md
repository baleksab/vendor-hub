# Contributing

Thanks for helping out. This repo is a pnpm monorepo for a microfrontend setup: `packages/shell` (React Router 8 SSR host) the remotes in `packages/*` (Module Federation, client-only) `packages/server` (Fastify REST API), `packages/types` (API types generated from the server's OpenAPI document), `packages/api-client` (shared fetch client) and `packages/ui` (shared theme and components). Read [`ARCHITECTURE.md`](ARCHITECTURE.md) first, and the `ARCHITECTURE.md` of the package you touch.

## Getting started

Requirements: Node 24 (see `.nvmrc`) and the pnpm version from `packageManager` in `package.json`.

```sh
pnpm install
pnpm dev      # shell and remotes in parallel (the shell needs packages/shell/.env.secret)
pnpm server:dev  # API server (not started by pnpm dev)
pnpm db:up    # Postgres in Docker (needs packages/server/.env.secret)
pnpm check    # lint + typecheck + build
```

Other useful commands:

| Command                  | What it does                                  |
| ------------------------ | --------------------------------------------- |
| `pnpm lint` / `lint:fix` | oxlint (type-aware)                           |
| `pnpm typecheck`         | typecheck all packages                        |
| `pnpm format`            | format with oxfmt                             |
| `pnpm format:check`      | verify formatting                             |
| `pnpm build`             | build remotes, shell, server                  |
| `pnpm test`              | unit tests (Vitest)                           |
| `pnpm db:up` / `db:down` | start / stop Postgres (Docker Compose)        |
| `pnpm stack:deploy`      | build and start the whole stack in Docker     |
| `pnpm stack:down`        | stop the Docker stack                         |
| `pnpm db:reset`          | stop Postgres and delete its volume           |
| `pnpm types:generate`    | regenerate API types (server must be running) |

A husky pre-commit hook runs lint and typecheck. Don't bypass it with `--no-verify`. If it fails, fix the cause.

## Workflow

1. Open or pick an issue. For anything bigger than a small fix, agree on the approach in the issue first.
2. Branch from `main`.
3. Make small, focused commits.
4. Run `pnpm check`, `pnpm format:check` and `pnpm test` locally.
5. Open a pull request to `main`.

`main` is protected: no direct pushes, every change goes through a PR.

## Branch names

Format: `<type>/<short-kebab-description>`, optionally with the issue number.

```
feat/remote-error-boundary
fix/42-manifest-url-hydration
chore/bump-mantine
docs/contributing-guide
```

Types are the same as for commits (below).

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <summary>

<optional body: what and why, not how>

<optional footer: Closes #12, BREAKING CHANGE: ...>
```

**Types:** `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `chore`, `revert`.

**Scopes:** `shell`, `remotes`, `server`, `types`, `api-client`, `ui`, `user-administrator`, `vendor-administrator`, `insights`, `deps`, `infra` (nginx, docker compose), `repo` (root config, tooling, CI). For a change to one specific remote, use its package name as the scope instead of `remotes`.

Rules for the summary: imperative mood ("add", not "added"), lowercase, no trailing period, up to about 72 characters.

```
feat(shell): load remote manifest URL from root loader
fix(remotes): stop importing Mantine CSS in embedded entry
build(deps): bump vite in catalog
docs(repo): add contributing guide
```

Breaking changes use `!` after the scope (`feat(shell)!: ...`) and a `BREAKING CHANGE:` footer.

## Pull requests

- Keep a PR to one logical change. Unrelated cleanups go in their own PR.
- The PR title follows the commit format, because we **squash merge** and the title becomes the commit on `main`.
- Write the PR title and description in English.
- Fill in the PR template. Link the issue with `Closes #<number>`.
- Mark it as a draft while it's still in progress.
- CI and local checks must pass before review: `pnpm check`, `pnpm format:check` and `pnpm test`. CI (`.github/workflows/checks.yml`) runs format, lint, typecheck, build and unit tests as separate jobs on every PR and on pushes to `main`.
- Add screenshots or a short recording for visible UI changes.
- Address review comments with new commits, don't force-push over a review in progress. Squash happens on merge.
- At least one approval is needed. The author merges after approval, once checks are green.
- Delete the branch after merge.

## Project rules

These come from the repo's architecture and are checked in review.

- **Versions live in the catalog.** Add or bump dependencies in `pnpm-workspace.yaml` and use `catalog:` in packages (`catalogMode: strict`). The only exception is the React Router packages, pinned in `packages/shell/package.json`, and they must all match each other.
- **Root has only framework-agnostic devDependencies** (`typescript`, `oxlint`, `oxlint-tsgolint`, `oxfmt`, `husky`). No react, vite, tailwind or router there.
- **No magic values.** No hosts, ports or URLs in code, configs or scripts. They come from the package's `.env` / `.env.local` through its `env.ts`, which throws on a missing key. No fallbacks.
- **No secrets in committed env files.** `.env.local` is committed on purpose, so it holds non-secret local values only. Secrets go to the gitignored `.env.secret` (server and shell); copy `.env.secret.example` to create it. Secrets are read at runtime only, so `pnpm check` and CI run without them.
- **Browser API calls go through the shell proxy.** The token stays in an HttpOnly cookie. A new path for remotes is added to the allowlist in `packages/shell/src/proxy/proxyAllowlist.ts` on purpose.
- **Only the shell is SSR.** Remotes load client-side after hydration.
- **Shared singletons.** `react`, `react-dom`, `@mantine/core` and `@mantine/hooks` stay `singleton` in every `shared` config, and the two Mantine packages share one version. `react-router` is a singleton too in every remote that uses it, with the same version as the shell, and so is `@tanstack/react-query`: the shell owns the `QueryClient`, so every remote shares one cache.
- **The theme lives in `@vendor-hub/ui`, the shell applies it.** Embedded remotes use Mantine components without a provider or Mantine CSS.
- **Lint config.** Root `.oxlintrc.json` has only shared rules. Each package extends it and enables its own plugins.
- **Lockfile.** Commit `pnpm-lock.yaml` changes together with the dependency change that caused them, and never edit it by hand.

## API changes

Every route declares its Zod schemas, because they are the source of the OpenAPI document (Swagger UI at `/docs`, JSON at `/swagger/schema.json`). When you change a route schema, start the server (`pnpm server:dev`), run `pnpm types:generate` and commit the changed `packages/types/src/generated/schema.gen.ts` together with the change. `pnpm --filter @vendor-hub/types types:check` verifies that the committed file is up to date. Never edit the generated file by hand.

## Database

Postgres runs in Docker from the root `docker-compose.yml`. Copy `packages/server/.env.secret.example` to `packages/server/.env.secret`, then:

```sh
pnpm db:up
pnpm --filter @mfe/server db:migrate
pnpm --filter @mfe/server db:seed-admin   # first administrator, from ADMIN_* env keys
```

The Drizzle schema is `packages/server/src/db/schema.ts`. After changing it run `pnpm --filter @mfe/server db:generate`, review the generated SQL and commit it. Applied migrations are never edited. Integration tests (`*.e2e.test.ts`) need the database and run with `pnpm --filter @mfe/server test:e2e`.

## Code style

- Formatting is handled by oxfmt (`pnpm format`, also on save in VS Code). Don't argue with the formatter, change its config in a separate PR if needed.
- Lint is handled by oxlint. Don't disable a rule inline without a comment explaining why.
- TypeScript strict mode stays on. Avoid `any`, prefer `unknown` plus narrowing.
- Separate logical blocks (loops, `if`/`else`, `try`/`catch`, groups of declarations) with a blank line.
- Remove dead code instead of commenting it out.

## Issues

Use the issue templates (bug report, feature request). For a bug include: what you did, what you expected, what happened, the package, and your Node and pnpm versions. A minimal reproduction helps the most.

## Security

Don't open a public issue for a vulnerability. Contact the maintainers privately instead.
