# Sync Specs Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `.claude/skills/sync-specs/SKILL.md`, a project skill that runs the
Brex spec-sync pipeline (sync → generate → test/typecheck/lint → docs-array check →
changeset → commit) unattended, then stops for an explicit go-ahead before pushing a
branch and opening a PR.

**Architecture:** A single Markdown skill file — no new scripts, no new dependencies.
All orchestration is expressed as sequential, numbered instructions Claude follows when
`/sync-specs` is invoked, reusing the repo's existing `bun run sync-specs` / `bun run
generate` / `bun test` / `bun run typecheck` / `bun run lint` commands plus `git` and
`gh`. The file is built up incrementally, one pipeline stage per task, each stage
verified against the real repo/commands before moving on.

**Tech Stack:** Claude Code project skill (Markdown + YAML frontmatter), Bun, git, GitHub CLI (`gh`).

**Spec:** `docs/superpowers/specs/2026-07-12-sync-specs-skill-design.md`

## Global Constraints

- Skill file lives only at `.claude/skills/sync-specs/SKILL.md` — no other files are
  created or modified by this project.
- `disable-model-invocation: true` — the skill must never auto-fire; only an explicit
  `/sync-specs` invocation runs it.
- `allowed-tools` is scoped to exactly: `Bash(bun run sync-specs)`, `Bash(bun run
  generate)`, `Bash(bun test)`, `Bash(bun run typecheck)`, `Bash(bun run lint)`,
  `Bash(git *)`, `Bash(gh *)` — no blanket `Bash(*)`.
- On any `bun run generate` / `bun test` / `bun run typecheck` / `bun run lint` failure:
  stop the entire run, print the exact error, leave the working tree uncommitted. Never
  guess a fix (especially never guess a `scripts/generate/overrides.ts` entry).
- Exactly one human checkpoint, immediately before `git push` / `gh pr create`. Every
  earlier step (sync, generate, tests, docs-array fix, changeset, local commit) runs
  without stopping.
- Conventional Commits: `chore:` for no-op/patch-tier syncs, `feat:` for additive
  (minor), `feat!:` + `BREAKING CHANGE:` footer for breaking (major) — mirroring commits
  `348c27b` / `bbc4efd` already in this repo's history.
- Never silently force-push or overwrite an existing `sync-specs/*` branch (local or
  remote) — stop and ask instead.

---

## Task 1: Scaffold the skill — frontmatter, header, Step 1 (sync + no-op exit)

**Files:**
- Create: `.claude/skills/sync-specs/SKILL.md`

**Interfaces:**
- Produces: the skill file's frontmatter (`name: sync-specs`, `disable-model-invocation:
  true`, `allowed-tools: ...`) and its `## Step 1 — Sync specs` section, which every
  later task's sections are appended after.

- [ ] **Step 1: Write the frontmatter, header, and Step 1 section**

Create `.claude/skills/sync-specs/SKILL.md` with exactly this content:

```markdown
---
name: sync-specs
description: >
  Syncs the vendored Brex OpenAPI specs, regenerates the SDK, runs the test/lint/typecheck
  gates, drafts a changeset, commits, and (after confirmation) opens a PR against main.
disable-model-invocation: true
allowed-tools: >
  Bash(bun run sync-specs) Bash(bun run generate) Bash(bun test) Bash(bun run typecheck)
  Bash(bun run lint) Bash(git *) Bash(gh *)
---

# Sync Brex specs, regenerate, and open a PR

Brings the SDK up to date with Brex's published OpenAPI specs. Runs the full pipeline
unattended through a local commit, then stops and waits for an explicit go-ahead before
pushing or opening a PR — see
`docs/superpowers/specs/2026-07-12-sync-specs-skill-design.md` for the design rationale.

Capture today's date once at the start and reuse it in every step below (branch name,
changeset filename):
```
date +%Y-%m-%d
```

## Step 1 — Sync specs

Run:
```
bun run sync-specs
```

Read its final summary line:

- `All specs up to date.` → **stop here.** Tell the user nothing changed. Create no
  branch, commit, or PR. This run is done.
- `N spec(s) changed. Review the diff, run \`bun run generate\`, and commit both.` →
  continue to Step 2.
```

- [ ] **Step 2: Verify the frontmatter parses**

Run:
```bash
bun -e "
import { parse } from 'yaml';
const text = await Bun.file('.claude/skills/sync-specs/SKILL.md').text();
const fm = text.split('---')[1];
console.log(parse(fm));
"
```
Expected output: an object containing `name: 'sync-specs'`, `disable-model-invocation:
true`, and the `allowed-tools` string — confirming the frontmatter is valid YAML before
any Claude Code discovery mechanism has to parse it.

- [ ] **Step 3: Verify Step 1's documented behavior against the live repo**

Run:
```bash
bun run sync-specs
```
Expected: every one of the 10 specs reports `unchanged` and the final line is `All specs
up to date.` (this is the current baseline — confirms the "stop here, nothing to sync"
exit path in the skill text matches today's real output). Run `git status --short`
afterward and confirm it is empty (sync-specs made no changes).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat: scaffold sync-specs skill with sync step"
```

---

## Task 2: Add Step 2 (read spec diff) and Steps 3/3b (generate + test gates)

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md` (append after the `## Step 1 — Sync
  specs` section written in Task 1)

**Interfaces:**
- Consumes: the file created in Task 1, ending with the `## Step 1 — Sync specs`
  section's final line: `` continue to Step 2. `` followed by a closing code fence.
- Produces: `## Step 2 — Read the spec diff`, `## Step 3 — Regenerate`, and `## Step 3b —
  Test, typecheck, lint` sections.

- [ ] **Step 1: Append the Step 2 / Step 3 / Step 3b sections**

Using an editor tool, find this exact text at the end of the file (the last lines
written in Task 1):

```
- `N spec(s) changed. Review the diff, run \`bun run generate\`, and commit both.` →
  continue to Step 2.
```

Replace it with the same text followed immediately by:

```

## Step 2 — Read the spec diff

Run:
```
git diff -- specs/
```

Read the full diff yourself (not just `--stat`) — this is the same upstream diff
`CONTRIBUTING.md` asks a human to "review carefully." Note, per changed spec file:
- new or removed operations (paths/methods)
- new or removed required request fields
- new, removed, or renamed response fields
- enum value changes
- pure formatting/prose changes (descriptions, examples, key ordering) with no schema
  impact

This understanding feeds Step 5 (bump classification). Step 4 only cares about whole
specs being added or removed, not this level of detail.

## Step 3 — Regenerate

Run:
```
bun run generate
```

**On success**, it prints a `Generated:` summary with per-spec operation counts.
Continue to Step 3b.

**On failure**, it prints exactly one line of the form:
```
✗ generation failed: <message>
```
`<message>` already names the fix, e.g.:
```
✗ generation failed: method name collision on "vendors.create": accounting.createVendor (POST /vendors) vs payments.createVendor (POST /v2/vendors); add an override: operations["payments.createVendor"] = "<name>"
```
or:
```
✗ generation failed: deriving a method name for someOperationId (tag "Some Tag") produced an empty name; add an override: operations["specId.someOperationId"] = "<name>"
```

**Stop the entire run here.** Print the error verbatim. Do not guess an override
yourself — `scripts/generate/overrides.ts` is where the fix goes, and picking the right
name is a human judgment call (see `CLAUDE.md`'s naming algorithm section). Leave the
working tree exactly as it is: specs updated, nothing committed. Tell the user to add
the suggested override, then re-invoke `/sync-specs` — `bun run sync-specs` will report
"up to date" (a no-op) and the pipeline falls through to this step again.

## Step 3b — Test, typecheck, lint

Run:
```
bun test && bun run typecheck && bun run lint
```

Any failure: **stop the entire run**, print the failure output, leave the working tree
uncommitted. A routine spec sync breaking these needs a human look, not an automatic
workaround.
```

- [ ] **Step 2: Verify the generator's failure-message format against the real source**

Run:
```bash
grep -n "add an override" scripts/generate/naming.ts
```
Expected: two matches (the empty-derived-name case and the method-name-collision case),
confirming the two example error strings written into Step 3 above are drawn from real
`fail(...)` call sites and not invented.

- [ ] **Step 3: Verify the success-path output format**

Run:
```bash
grep -n "console.log" scripts/generate.ts
```
Expected: matches showing the `Generated:` header and the per-spec `<id> <count> ops
(<namespaces>)` line format, confirming the "On success" description in Step 3 matches
the real script.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat: add generate and test/lint gate steps to sync-specs skill"
```

---

## Task 3: Add Step 4 (docs SPECS-array parity check)

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md` (append after `## Step 3b — Test,
  typecheck, lint`)

**Interfaces:**
- Consumes: the file from Task 2, ending with `` ...needs a human look, not an automatic
  workaround. ``
- Produces: `## Step 4 — Docs SPECS-array parity check`

- [ ] **Step 1: Append the Step 4 section**

Find this exact text at the end of the file:

```
Any failure: **stop the entire run**, print the failure output, leave the working tree
uncommitted. A routine spec sync breaking these needs a human look, not an automatic
workaround.
```

Replace it with the same text followed by:

```

## Step 4 — Docs SPECS-array parity check

`scripts/specs.config.ts` and `docs/astro.config.mjs` each hand-maintain their own list
of the same spec ids; nothing enforces they match. Compare them:

```
sed -n "/^export const SPECS/,/^];/p" scripts/specs.config.ts | grep -oE "id: '[a-z]+'" | sed -E "s/id: '([a-z]+)'/\1/" | sort
```
```
sed -n "/^const SPECS = \[/,/^\];/p" docs/astro.config.mjs | grep -oE "'[a-z]+'" | tr -d "'" | sort
```

- **Match** (the common case — field/operation-level changes, not a whole new API):
  nothing to do, continue to Step 5.
- **Differ** (Brex published a brand-new API, or retired one): edit
  `docs/astro.config.mjs`'s `SPECS` array to match `scripts/specs.config.ts` exactly.
  Note this in the Step 7 summary.
```

- [ ] **Step 2: Verify both commands against the live repo**

Run:
```bash
diff <(sed -n "/^export const SPECS/,/^];/p" scripts/specs.config.ts | grep -oE "id: '[a-z]+'" | sed -E "s/id: '([a-z]+)'/\1/" | sort) \
     <(sed -n "/^const SPECS = \[/,/^\];/p" docs/astro.config.mjs | grep -oE "'[a-z]+'" | tr -d "'" | sort) && echo MATCH
```
Expected: `MATCH` (both lists currently contain the same 10 ids: accounting, budgets,
expenses, fields, onboarding, payments, team, transactions, travel, webhooks). This
confirms the comparison commands are syntactically correct and actually diff the right
sections of both files, independent of each file's indentation style (`scripts/
specs.config.ts` uses 4 spaces; `docs/astro.config.mjs` uses a tab — the `sed` range
plus content-only `grep -oE` avoids depending on either).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat: add docs SPECS-array parity check to sync-specs skill"
```

---

## Task 4: Add Step 5 (classify change tier, author changeset)

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md` (append after `## Step 4 — Docs
  SPECS-array parity check`)

**Interfaces:**
- Consumes: the file from Task 3, ending with `` ...Note this in the Step 7 summary. ``
- Produces: `## Step 5 — Classify the change and write a changeset`

- [ ] **Step 1: Append the Step 5 section**

Find this exact text at the end of the file:

```
- **Differ** (Brex published a brand-new API, or retired one): edit
  `docs/astro.config.mjs`'s `SPECS` array to match `scripts/specs.config.ts` exactly.
  Note this in the Step 7 summary.
```

Replace it with the same text followed by:

```

## Step 5 — Classify the change and write a changeset

Based on the Step 2 reading, and `git diff -- src README.md` (generated output plus the
README table — deliberately excluding `specs/`, which will always show something at
this point), classify the overall change into exactly one tier:

- **skip** — `git diff -- src README.md` is empty (the spec diff was pure upstream noise
  `generate` fully normalizes away — e.g. YAML comments, insignificant formatting). No
  changeset, but the `specs/` change itself is still committed in Step 6. Go to Step 6.
- **patch** — generated output changed, but only comments/JSDoc/README-table content
  (descriptions, examples) — no type, method signature, or field changed.
- **minor** — purely additive: new operations, new optional fields/params, new response
  fields.
- **major** — anything removed, renamed, narrowed, or newly required on an existing
  operation (breaking for existing callers).

For patch/minor/major, write `.changeset/sync-specs-<date>.md` directly — do not run the
interactive `bunx changeset` wizard (it's a TTY prompt, not scriptable). Match the
existing repo convention (`git show bbc4efd:.changeset/brex-v2-rewrite.md` shows a real
example):

```
---
"brex": <patch|minor|major>
---

<One-line summary of what changed.>

- <bullet per notable addition/removal, one per affected spec>
```
```

- [ ] **Step 2: Verify the changeset frontmatter format against the real historical example**

Run:
```bash
git show bbc4efd:.changeset/brex-v2-rewrite.md
```
Expected: frontmatter `"brex": major` followed by a blank line and prose — confirming
the template written into Step 5 (package key `"brex"`, bump value, blank line, then
markdown body) matches the one real changeset this repo has ever committed.

- [ ] **Step 3: Verify the package name used in the changeset key**

Run:
```bash
grep -m1 '"name"' package.json
```
Expected: `"name": "brex"` — confirming `"brex"` is the correct changeset frontmatter key
(matches `.changeset/config.json`'s single-package setup, no `fixed`/`linked` groups).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat: add change classification and changeset authoring to sync-specs skill"
```

---

## Task 5: Add Step 6 (branch + commit)

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md` (append after `## Step 5 — Classify the
  change and write a changeset`)

**Interfaces:**
- Consumes: the file from Task 4, ending with the closing ` ``` ` of the changeset
  template block.
- Produces: `## Step 6 — Branch and commit`

- [ ] **Step 1: Append the Step 6 section**

Find this exact text at the end of the file:

```
<One-line summary of what changed.>

- <bullet per notable addition/removal, one per affected spec>
```
```

(that's the changeset template's closing fence from Task 4). Replace it with the same
text followed by:

```

## Step 6 — Branch and commit

Create the branch before committing, so `main` never moves locally:

```
git checkout -b sync-specs/<date>
```

If that branch already exists locally, **stop and ask** how to proceed instead of
reusing or overwriting it — it likely means a previous run already got this far.

Stage everything the pipeline touched:
```
git add specs/ src/ README.md .changeset/ docs/astro.config.mjs
```
(`docs/astro.config.mjs` only if Step 4 changed it; `.changeset/` only if Step 5 wrote
one.)

Commit type mirrors the Step 5 tier:

| Tier | Commit type | Example subject |
|------|------------|------------------|
| skip | `chore:` | `chore: sync specs from Brex (no functional change)` |
| patch | `chore:` | `chore: sync specs from Brex — refresh descriptions` |
| minor | `feat:` | `feat: sync specs from Brex — add <thing>` |
| major | `feat!:` | same subject, plus a `BREAKING CHANGE:` footer describing the break, styled like commit `348c27b` |
```

- [ ] **Step 2: Verify the commit-style precedent**

Run:
```bash
git show --no-patch --format="%s%n%n%b" 348c27b
```
Expected: subject line `feat!: rebuild as v2 with deterministic SDK generation from Brex
OpenAPI specs` followed by a `BREAKING CHANGE:` paragraph — confirming the `feat!:` +
footer style referenced in the Step 6 table is a real precedent in this repo, not an
invented convention.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat: add branch and commit step to sync-specs skill"
```

---

## Task 6: Add Step 7 (checkpoint) and Step 8 (push + PR)

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md` (append after `## Step 6 — Branch and
  commit`)

**Interfaces:**
- Consumes: the file from Task 5, ending with the commit-type table's final row (`major
  | feat!: | ...`).
- Produces: `## Step 7 — The checkpoint` and `## Step 8 — Push and open the PR`. This is
  the last task that edits the skill file's body.

- [ ] **Step 1: Append the Step 7 / Step 8 sections**

Find this exact text at the end of the file:

```
| major | `feat!:` | same subject, plus a `BREAKING CHANGE:` footer describing the break, styled like commit `348c27b` |
```

Replace it with the same text followed by:

```

## Step 7 — The checkpoint

Print a short structured summary, not a raw diff dump:
- which spec files changed
- classification tier + changeset text (or "no changeset — no functional change")
- test/typecheck/lint: pass
- docs array: unchanged, or "updated to add/remove `<id>`"
- the commit: `<short-hash> <subject line>`

Then ask explicitly:
> Ready to push `sync-specs/<date>` and open a PR against `main`?

**Wait for an explicit go-ahead. Do not proceed past this line without one.**

## Step 8 — Push and open the PR (only after go-ahead)

Check whether the branch already exists on the remote first:
```
git ls-remote --exit-code --heads origin sync-specs/<date>
```
If it does, **stop and ask** how to proceed rather than force-pushing over it.

Otherwise:
```
git push -u origin sync-specs/<date>
gh pr create --base main --title "<mirror the Step 6 commit subject>" --body "<mirror the Step 7 summary>"
```

Report the PR URL `gh pr create` prints.
```

- [ ] **Step 2: Verify `gh` is available and authenticated**

Run:
```bash
gh auth status
```
Expected: shows an authenticated account for `github.com`. If this fails, note it as a
prerequisite the skill's Step 8 will surface naturally (as an ordinary command failure)
rather than something the skill needs special handling for.

- [ ] **Step 3: Verify the full file is well-formed Markdown end-to-end**

Run:
```bash
grep -c "^## Step" .claude/skills/sync-specs/SKILL.md
```
Expected: `8` (Step 1 through Step 8, one `##` heading each — confirms no section was
dropped or duplicated across Tasks 1-6's incremental edits).

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat: add checkpoint and push/PR steps to sync-specs skill"
```

---

## Task 7: End-to-end rehearsal

**Files:**
- None created or modified permanently — this task only exercises the finished skill's
  underlying commands against a temporary, fully-reverted local edit.

**Interfaces:**
- Consumes: the completed `.claude/skills/sync-specs/SKILL.md` from Task 6.
- Produces: confidence that Step 3/Step 5's "skip tier" path behaves as documented, plus
  a documented trace through the "major tier" path using real repo history (no synthetic
  breaking change is fabricated, to avoid introducing an incorrect OpenAPI edit).

- [ ] **Step 1: Rehearse the "skip tier" path with a cosmetic-only edit**

Add a harmless comment line to a vendored spec:
```bash
printf '\n# rehearsal: cosmetic-only edit, reverted below\n' >> specs/webhooks.yaml
```

- [ ] **Step 2: Run generate and confirm it's a true no-op for generated output**

```bash
bun run generate
git diff --stat -- src README.md
```
Expected: `bun run generate` succeeds, and `git diff --stat -- src README.md` prints
nothing (no output) — confirming the Step 5 "skip" tier's detection command
(`git diff -- src README.md`) correctly identifies a comment-only spec change as having
zero effect on generated output.

- [ ] **Step 3: Revert the rehearsal edit**

```bash
git checkout -- specs/webhooks.yaml
bun run generate
git status --short
```
Expected: `git status --short` prints nothing — the working tree is back to clean.

- [ ] **Step 4: Trace the "major tier" path against real history instead of a synthetic edit**

Run:
```bash
git show --stat bbc4efd
git show --stat 348c27b
```
Read both. Confirm that if `/sync-specs` had produced this exact change, Step 5 would
classify it **major** (constructor signature change, `brex.request()` removal — both
breaking), Step 6 would commit as `feat!:` with a `BREAKING CHANGE:` footer, and the
changeset from Task 4's Step 2 (`bbc4efd`) is exactly the shape Step 5 asks for. No code
changes result from this step — it's a read-only trace confirming the skill's
instructions, applied to a real historical breaking change, produce the same outcome
that change actually shipped with.

- [ ] **Step 5: Final check — nothing left uncommitted**

```bash
git status --short
```
Expected: empty. If anything shows, it's leftover rehearsal state — revert it before
considering this plan complete.
