# Agent guide for `brex`

Unofficial TypeScript SDK for the Brex API, **generated deterministically** from vendored OpenAPI specs. Bun is the toolchain.

## The one rule that matters

**Never hand-edit generated files.** That's every `src/**/*.gen.ts`, every `src/<api>/index.ts`, `src/index.ts`, and the API table in `README.md` (between the `generated:api-table` markers). They are overwritten by `bun run generate`, and CI fails if committed output differs from regenerated output.

To change generated output, edit the generator (`scripts/generate/`) or the overrides (`scripts/generate/overrides.ts`), then run `bun run generate` and commit the result together with your change.

Hand-written code lives only in: `src/core/` (runtime), `scripts/` (generator), `tests/`.

## Commands

| Command | Purpose |
| --- | --- |
| `bun install` | Install (frozen lockfile in CI) |
| `bun run generate` | Regenerate all SDK code from `specs/` — idempotent |
| `bun run sync-specs` | Re-download specs from developer.brex.com (humans only, never CI) |
| `bun test` | Unit, snapshot, and integration tests |
| `bun run typecheck` | `tsc` for everything + `tsconfig.lib.json` proving `src/` is runtime-agnostic |
| `bun run lint` / `bun run format` | Biome |
| `bun run build` | tsdown → `dist/` (11 ESM entries + d.ts) |
| `bun run check:package` | publint + arethetypeswrong |

## Repo map

```
specs/                  vendored Brex OpenAPI YAML (byte-for-byte upstream; edit never)
scripts/specs.config.ts spec id ↔ URL map (id = filename = src dir = subpath export)
scripts/generate.ts     orchestrator
scripts/generate/
  ir.ts                 spec → validated operation IR (hard-fails on surprises)
  naming.ts             tag → namespace, operationId → method name
  overrides.ts          committed naming corrections (unused keys fail the build)
  transform.ts          breaks oneOf/allOf polymorphism cycles before type emit
  emit-*.ts             IR → source text (types, schemas, client, entries, README table)
src/core/               hand-written runtime: BrexCore, BrexError, PagePromise, query
src/<api>/              generated per spec: types.gen, schemas.gen, client.gen, index
src/index.ts            generated root: Brex class composing all namespaces
tests/                  naming table tests, fixture snapshots, mocked-fetch integration,
                        compile-only type assertions (tests/types/*.test-d.ts)
```

## Naming algorithm (summary)

Namespace = camelCased tag (`"Spend Limits (v2)"` → `spendLimitsV2`). Method = operationId minus a trailing `_N` dedup suffix, minus the longest tag-derived resource-noun run (`createVendor` → `create`), minus a trailing `ById`. Empty results, collisions, and unused overrides all **fail generation** with the exact override key to add.

To fix an awkward name, add to `scripts/generate/overrides.ts`:

```ts
tags: { "<specId>.<Tag Name>": { namespace: "...", resourceNouns: ["PascalNoun", ...] } },
operations: { "<specId>.<operationId>": "methodName" },
```

## Invariants the generator enforces (ir.ts)

Exactly one tag per operation; JSON-only bodies/responses; `Idempotency-Key` is the only header param; exactly one 2xx response; path template params all declared. If Brex's specs ever violate one, generation fails loudly — extend `src/core` + `ir.ts` deliberately rather than special-casing.

## Updating for upstream API changes

```sh
bun run sync-specs   # review the specs/ diff carefully
bun run generate     # may fail demanding new overrides — add them
bun test && bun run typecheck
bunx changeset       # describe the API surface change
```

## Style

- ESM-only, web-standard APIs in `src/` (no `node:` or Bun imports — `tsconfig.lib.json` enforces this)
- Exact-pinned devDependencies; version bumps of `openapi-typescript`/`typescript`/`@biomejs/biome`/`tsdown` change generated or published output — treat as deliberate, reviewed changes
- Tests use `bun:test` with the injectable `fetch` (see `tests/helpers.ts`); no network in tests
