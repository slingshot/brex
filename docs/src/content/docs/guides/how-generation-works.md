---
title: How generation works
description: The SDK is a pure function of vendored OpenAPI specs, overrides, and pinned tools.
---

```
specs/*.yaml  ──bun run generate──▶  src/<api>/{types,schemas,client}.gen.ts + entries
```

- The 10 OpenAPI specs are **vendored byte-for-byte** in the repo and re-fetched
  only by a human running `bun run sync-specs`.
- `bun run generate` is a **pure function** of the specs, the overrides file, and
  exactly-pinned tool versions. Running it twice produces byte-identical output.
- CI regenerates on every PR and **fails on drift**, so the published SDK can
  never silently diverge from the specs it claims to implement.
- Types come from [openapi-typescript](https://openapi-ts.dev); the thin client
  layer (a small hand-written runtime) is generated with method names cleaned
  from operationIds (`createVendor` → `vendors.create`).

## Where the docs come from

This documentation site is part of the same story. The
[API reference](/brex/api/readme/) is generated with [TypeDoc](https://typedoc.org) from the
SDK's source — and that source carries a JSDoc comment on every method, built
from each operation's OpenAPI **summary and full description**. So the reference
you read here, the hover-docs in your editor, and the SDK itself all trace back
to the same vendored specs.

To pick up upstream API changes, a maintainer runs
`bun run sync-specs && bun run generate`, reviews the diff, and commits both.
