---
"brex": major
---

Ground-up v2 rewrite: the entire SDK is now generated deterministically from Brex's published OpenAPI specs.

- Full coverage of all 10 Brex APIs (~108 operations) with types straight from the specs
- Namespaced client: `new Brex({ token })` → `brex.vendors.create()`, `brex.users.list()`, …
- Tree-shakeable per-API subpath imports: `brex/payments`, `brex/expenses`, …
- ESM-only, native `fetch`, zero runtime dependencies; Node ≥ 20.19, Bun, browsers, edge
- Auto-pagination: every list method is awaitable (one page) and async-iterable (all items)
- Automatic `Idempotency-Key` headers where Brex requires them
- `BrexError` with `status`, parsed `body`, `requestId`, and full response `headers`

Breaking: `new Brex(token)` is now `new Brex({ token })`; the untyped `brex.request()` escape hatch is gone (compose with `BrexCore` instead); CommonJS builds are no longer shipped (Node ≥ 20.19 `require()` of ESM still works).
