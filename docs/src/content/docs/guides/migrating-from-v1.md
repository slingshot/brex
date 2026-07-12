---
title: Migrating from v1
description: v2 is a ground-up rewrite — here's how the old surface maps to the new one.
---

v2 is a ground-up rewrite; v1's hand-written wrapper is gone.

| v1 | v2 |
| --- | --- |
| `new Brex(token)` | `new Brex({ token })` |
| `brex.request({ endpoint, method, … })` | Typed methods, e.g. `brex.vendors.list()` |
| `brex.vendors.list()` (partial coverage) | Full coverage of all 10 published APIs |
| `isomorphic-unfetch` polyfill | Native `fetch`, zero dependencies |
| CommonJS + ESM | ESM-only (Node ≥ 20.19 `require()` still works) |

## What to change

1. **Construct with an options object** — `new Brex({ token })` instead of
   `new Brex(token)`.
2. **Replace raw `request(...)` calls** with the typed namespace methods. Browse
   the [API reference](/brex/api/readme/) to find the method that maps to your old endpoint.
3. **Drop the fetch polyfill** — v2 uses the runtime's native `fetch`. If you're
   on a runtime without one, inject a `fetch` via the
   [client options](/brex/guides/options/).
4. **Expect ESM** — the package is ESM-only. `require("brex")` still works on
   Node ≥ 20.19 via `require(esm)`.
