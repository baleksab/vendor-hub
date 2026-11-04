# Contributing

Thanks for helping out. This repo is a pnpm monorepo for a microfrontend setup: `packages/shell` (React Router 8 SSR host) and the remotes in `packages/*` (Module Federation, client-only). Read [`ARCHITECTURE.md`](ARCHITECTURE.md) first, and the `ARCHITECTURE.md` of the package you touch.

## Getting started

Requirements: Node 24 (see `.nvmrc`) and the pnpm version from `packageManager` in `package.json`.

```sh
pnpm install
pnpm dev      # shell and remotes in parallel
pnpm check    # lint + typecheck + build
```

Other useful commands:

| Command                 | What it does                              |
| ----------------------- | ----------------------------------------- |
| `pnpm lint` / `lint:fix` | oxlint (type-aware)                      |
| `pnpm typecheck`        | typecheck all packages                    |
| `pnpm format`           | format with oxfmt                         |
| `pnpm format:check`     | verify formatting                         |
| `pnpm build`            | build remotes, then shell                 |

A husky pre-commit hook runs lint and typecheck. Don't bypass it with `--no-verify`. If it fails, fix the cause.

## Workflow

1. Open or pick an issue. For anything bigger than a small fix, agree on the approach in the issue first.
2. Branch from `main`.
3. Make small, focused commits.
4. Run `pnpm check` and `pnpm format:check` locally.
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

**Scopes:** `shell`, `remotes`, `deps`, `repo` (root config, tooling, CI). For a change to one specific remote, use its package name as the scope instead of `remotes`.

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
- Fill in the PR template. Link the issue with `Closes #<number>`.
- Mark it as a draft while it's still in progress.
- CI and local checks must pass before review: `pnpm check` and `pnpm format:check`.
- Add screenshots or a short recording for visible UI changes.
- Address review comments with new commits, don't force-push over a review in progress. Squash happens on merge.
- At least one approval is needed. The author merges after approval, once checks are green.
- Delete the branch after merge.

## Project rules

These come from the repo's architecture and are checked in review.

- **Versions live in the catalog.** Add or bump dependencies in `pnpm-workspace.yaml` and use `catalog:` in packages (`catalogMode: strict`). The only exception is the React Router packages, pinned in `packages/shell/package.json`, and they must all match each other.
- **Root has only framework-agnostic devDependencies** (`typescript`, `oxlint`, `oxlint-tsgolint`, `oxfmt`, `husky`). No react, vite, tailwind or router there.
- **No magic values.** No hosts, ports or URLs in code, configs or scripts. They come from the package's `.env` / `.env.local` through its `env.ts`, which throws on a missing key. No fallbacks.
- **No secrets in env files.** `.env.local` is committed on purpose, so it holds non-secret local values only.
- **Only the shell is SSR.** Remotes load client-side after hydration.
- **Shared singletons.** `react`, `react-dom`, `@mantine/core` and `@mantine/hooks` stay `singleton` in every `shared` config, and the two Mantine packages share one version.
- **The shell owns the Mantine theme and CSS.** Embedded remotes use Mantine components without a provider or Mantine CSS.
- **Lint config.** Root `.oxlintrc.json` has only shared rules. Each package extends it and enables its own plugins.
- **Lockfile.** Commit `pnpm-lock.yaml` changes together with the dependency change that caused them, and never edit it by hand.

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
