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
