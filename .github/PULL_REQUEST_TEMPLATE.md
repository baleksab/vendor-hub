## Summary

<!-- What does this PR change and why? -->

Closes #

## Type of change

- [ ] feat
- [ ] fix
- [ ] refactor / perf
- [ ] docs
- [ ] build / deps / ci / chore

## Packages touched

- [ ] `shell`
- [ ] `remotes`
- [ ] `server`
- [ ] `types`
- [ ] `api-client`
- [ ] `ui`
- [ ] `user-administrator`
- [ ] `vendor-administrator`
- [ ] `insights`
- [ ] `infra` (nginx, docker compose)
- [ ] root / tooling

## Checklist

- [ ] PR title follows Conventional Commits (`type(scope): summary`)
- [ ] `pnpm check` passes
- [ ] `pnpm format:check` passes
- [ ] New dependencies use `catalog:` (no versions in package `package.json`, except React Router)
- [ ] No hardcoded hosts, ports or URLs; new env keys are added to the package's `env.ts` and `.env` / `.env.local`
- [ ] No secrets in committed files (secrets go to the gitignored `.env.secret`)
- [ ] If the DB schema changed: a migration was generated with `db:generate`, reviewed and committed
- [ ] If the API changed: `pnpm types:generate` was run (server running) and the `packages/types` diff is committed
- [ ] Docs updated (`ARCHITECTURE.md` / `CLAUDE.md`) if architecture or rules changed

## Screenshots / notes for reviewers

<!-- Optional. Screenshots for UI changes, things to look at closely, follow-ups. -->
