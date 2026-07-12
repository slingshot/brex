# Contributing to brex

Thanks for helping! This repo is a deterministic SDK generator plus a small hand-written runtime — most changes are to the generator, not the generated output.

## Setup

```sh
# Requires Bun (https://bun.sh) — version pinned in package.json's packageManager
bun install   # also installs git hooks via lefthook
bun test
```

## Ground rules

1. **Never edit generated files** (`src/**/*.gen.ts`, `src/*/index.ts`, `src/index.ts`, the README API table). Edit `scripts/generate/` or `scripts/generate/overrides.ts` and run `bun run generate`. CI regenerates and fails on any diff.
2. **Commit generated output with the change that caused it** — one reviewable unit.
3. Keep `src/core/` free of Node/Bun-specific APIs; `bun run typecheck` enforces this via `tsconfig.lib.json`.
4. **Commit messages follow [Conventional Commits](https://www.conventionalcommits.org)** (`feat:`, `fix:`, `docs:`, `chore:`, … with `!` for breaking changes). Enforced locally by commitlint via a lefthook `commit-msg` hook, and in CI for PRs.

## Git hooks

[lefthook](https://lefthook.dev) installs these on `bun install`:

- **pre-commit** — Biome lint + format on staged files (fixes are re-staged automatically)
- **commit-msg** — commitlint (Conventional Commits; automation commits comply too — Changesets releases as `chore(release)`, Dependabot as `chore(deps)`/`ci(deps)`)
- **pre-push** — `bun run typecheck` + `bun test`

`git commit --no-verify` skips them in a pinch, but CI runs the same checks.

## Common tasks

### Fix an awkward generated method or namespace name

Add an entry to `scripts/generate/overrides.ts` (the generation failure message tells you the exact key), then `bun run generate`.

### Pull in upstream Brex API changes

```sh
bun run sync-specs    # re-downloads specs/*.yaml — review this diff carefully
bun run generate      # regenerates the SDK; may demand new overrides
bun test && bun run typecheck && bun run lint
```

Commit the spec diff and regenerated output together.

### Work on the runtime (`src/core/`)

Write a failing test in `tests/core/` first — everything there runs against the injectable `fetch` (`tests/helpers.ts`), so no network is involved.

## Before opening a PR

```sh
bun run generate   # must produce zero diff
bun run lint && bun run typecheck && bun test && bun run build
```

Then add a changeset describing the user-facing change:

```sh
bunx changeset
```

Releases are automated: merged changesets accumulate into a release PR ([Changesets](https://github.com/changesets/changesets)); merging that publishes to npm with provenance. The `v2` branch is in `alpha` pre-mode (`2.0.0-alpha.N`) until `bunx changeset pre exit`.

## Live smoke testing (optional)

Unit and integration tests never hit the network. To sanity-check against the real API with your own token:

```sh
BREX_TOKEN=your_token bun test tests/live.smoke.test.ts
```
