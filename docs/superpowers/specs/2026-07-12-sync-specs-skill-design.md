# `/sync-specs` project skill — design

## Context

Pulling in upstream Brex API changes is currently a fully manual, human-driven sequence
(documented in `CONTRIBUTING.md`): `bun run sync-specs` → review the `specs/` diff →
`bun run generate` → add any demanded `overrides.ts` entries → `bun test && bun run
typecheck && bun run lint` → write a changeset → commit → open a PR. Nothing about this
is hard, but it's easy to forget a step (especially the changeset) and it happens rarely
enough that the manual sequence isn't muscle memory.

This skill automates that whole sequence end-to-end, with a single human checkpoint
before anything becomes visible outside the local working tree (push + PR).

## Goals

- One `/sync-specs` invocation takes the repo from "specs might be stale" to "PR open
  against `main`, ready for the existing CI gates to run."
- Never silently paper over a real problem (generation failures, test failures, naming
  collisions) — stop and hand the human the exact error, the same way the generator
  already does today.
- Never push or open a PR without an explicit go-ahead, even though the rest of the
  pipeline runs unattended once invoked.

## Non-goals

- Not a generic "watch for upstream changes" cron job — it's invoked manually, only via
  `/sync-specs`, never triggered by Claude noticing something Brex-related in
  conversation.
- Not responsible for auditing the hand-written guide pages under
  `docs/src/content/docs/` — that's already covered on every PR/push by the external
  `docs-sentinel` reusable workflow (`.github/workflows/docs-sentinel.yml`).
- Not responsible for resolving naming collisions or override judgment calls itself — it
  surfaces the generator's own error and stops; a human (with Claude, conversationally)
  decides the `overrides.ts` entry.

## File layout & frontmatter

`.claude/skills/sync-specs/SKILL.md`

```yaml
---
name: sync-specs
description: >
  Syncs the vendored Brex OpenAPI specs, regenerates the SDK, runs the test/lint/typecheck
  gates, drafts a changeset, commits, and (after confirmation) opens a PR.
disable-model-invocation: true
allowed-tools: >
  Bash(bun run sync-specs) Bash(bun run generate) Bash(bun test) Bash(bun run typecheck)
  Bash(bun run lint) Bash(git *) Bash(gh *) Bash(date *)
---
```

`disable-model-invocation: true` because this is a deliberate ops action with real side
effects (eventually a push + PR) — it must never auto-fire just because a conversation
mentions Brex or specs. `allowed-tools` is scoped to the exact commands the pipeline
runs, not a blanket `Bash(*)`, so routine steps don't trigger permission prompts but
nothing outside this workflow is silently pre-approved.

## Pipeline

Runs straight through, no stops, until the checkpoint:

1. **`bun run sync-specs`.** If every spec reports "unchanged," stop immediately: report
   "nothing to sync," create no branch, commit, or PR.
2. **Read the `specs/*.yaml` diff.** This is the same byte-for-byte upstream diff
   `CONTRIBUTING.md` tells humans to "review carefully" — the skill reads it directly
   (not just `--stat`) to understand what changed: new/removed operations, required-field
   changes, enum changes, deprecations. This understanding feeds the changeset (step 6)
   and the docs-array check (step 5).
3. **`bun run generate`.**
   - On failure: stop the entire run and print the exact error verbatim. `ir.ts` and
     `naming.ts` already name the precise `overrides.ts` key needed — the skill does not
     guess an override on its own. The working tree is left dirty (specs updated,
     nothing committed) on purpose, so the next step is adding the override and
     re-invoking `/sync-specs`, which will re-run `sync-specs` (a no-op, since specs are
     already current) and fall through to `generate` again.
   - On success: continue.
4. **`bun test && bun run typecheck && bun run lint`.** Same stop-and-surface behavior on
   any failure — a routine spec sync breaking these is surprising enough to warrant a
   human look rather than an automatic workaround.
5. **Docs-array parity check.** Compare the spec `id`s in `scripts/specs.config.ts`
   against the hand-written `SPECS` array in `docs/astro.config.mjs`. Nothing today
   cross-checks these; they only diverge if Brex adds or removes an entire API spec (not
   per-operation/field changes). If they've diverged, update
   `docs/astro.config.mjs` to match and note this in the final summary.
6. **Author the changeset.** Skips the interactive `bunx changeset` wizard (it doesn't
   script well) and writes `.changeset/sync-specs-<date>.md` directly, in the same voice
   as the existing `brex-v2-rewrite.md`:
   - **major** — anything removed, renamed, narrowed, or newly required (breaking for
     existing callers)
   - **minor** — purely additive (new operations, new optional fields/params)
   - **no changeset at all** — the spec diff didn't produce any functional change to
     generated output (e.g. upstream reformatting/description-only edits that `generate`
     normalizes away)
7. **Commit.** Stage `specs/`, `src/`, `README.md`, `.changeset/`, and
   `docs/astro.config.mjs` if touched, as one Conventional Commit. Commit type mirrors
   the changeset bump: `chore:` for a no-changeset/no-op sync, `feat:` for additive,
   `feat!:` (with a `BREAKING CHANGE:` footer) for major — mirroring how `348c27b` /
   `bbc4efd` were written for the v2 rewrite.

## The one checkpoint

After the commit, print a short **structured summary** (not a raw diff dump):

- which specs changed
- changeset bump type + its summary text
- test/typecheck/lint status
- whether `docs/astro.config.mjs` needed a touch
- the commit hash + message

Then ask explicitly: *"Ready to push `sync-specs/<date>` and open a PR against `main`?"*

Only on an explicit go-ahead:

1. Create branch `sync-specs/<YYYY-MM-DD>` (date via `date +%Y-%m-%d`, since this runs as
   a conversational skill, not a workflow script — no restriction on using real dates
   here).
2. Push with `-u`.
3. `gh pr create` with a title and body drawn from the same summary (spec changes, bump
   type, changeset text), targeting `main`.
4. Report the resulting PR URL.

This is the only step that's visible outside the local working tree or hard to reverse,
so it's the only step that waits.

## Error handling / edge cases

- **Generate/test/typecheck/lint failure**: stop, surface the exact error, leave the
  working tree uncommitted. Never commit a spec-only change without the regenerated
  output it must ship with (`CONTRIBUTING.md`'s "commit both together" rule).
- **No spec changes**: exit after step 1, no side effects at all.
- **No functional change despite a spec diff**: commit with `chore:` and no changeset,
  explained in the checkpoint summary.
- **A `sync-specs/*` branch already exists** (e.g. a previous run stopped at generate and
  is being resumed): the skill surfaces this rather than silently force-pushing or
  overwriting it — asks how to proceed before creating/pushing a branch.
- **`gh` not authenticated / not installed**: surfaced as a normal command failure at the
  push/PR step; the commit itself is already safe on `main`'s working tree regardless.

## Testing & validation approach

There's no pending upstream Brex change to exercise the pipeline against right now, so
validation during implementation is:

- Confirm the "nothing changed" exit path against the real current state (`bun run
  sync-specs` reports all specs unchanged today).
- Hand-verify every command, path, and filename referenced in the skill against the
  actual repo (already cross-checked during design: `scripts/sync-specs.ts`,
  `scripts/specs.config.ts`, `scripts/generate.ts`, `docs/astro.config.mjs`,
  `.changeset/config.json`, `CONTRIBUTING.md`).
- Optionally, as a one-off rehearsal, temporarily edit a vendored spec file to simulate a
  small upstream change, run the skill through to the checkpoint, inspect its summary and
  changeset output, then revert — left as an implementation-time decision rather than a
  hard requirement of this spec.
