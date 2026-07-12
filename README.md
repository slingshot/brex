# brex

[![npm version](https://img.shields.io/npm/v/brex.svg)](https://www.npmjs.com/package/brex)
[![CI](https://github.com/slingshot/brex/actions/workflows/ci.yml/badge.svg)](https://github.com/slingshot/brex/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An unofficial TypeScript SDK for the [Brex API](https://developer.brex.com), maintained by [Slingshot](https://github.com/slingshot). Every client, method, and type is **generated deterministically from Brex's published OpenAPI specs** — the specs are vendored in this repo, generation is byte-for-byte reproducible, and CI fails if the committed code ever drifts from the specs.

- **Fully typed** — request bodies, query params, and responses are typed straight from the specs
- **Tree-shakeable** — import one API via subpaths (`brex/payments`) and the other nine never enter your bundle (~3.5 kB min for a single API)
- **Runs everywhere** — native `fetch`, zero runtime dependencies, ESM-only; Node ≥ 20.19 (including `require()`), Bun, Deno, browsers, and edge runtimes
- **Auto-pagination** — every list method is both a promise and an async iterator
- **Idempotency built in** — `Idempotency-Key` headers are sent automatically where Brex requires them

> [!IMPORTANT]
> This is an **unofficial library**, not created, maintained, or in any way connected with Brex Inc. or any associated entity. "Brex" is a registered trademark of Brex, Inc. Use of the Brex API is subject to the [Brex Access Agreement](https://www.brex.com/legal/developer-portal/). Most usage involves highly sensitive financial data — you are entirely responsible for securing it.

## Install

```sh
bun add brex
# or
npm install brex
```

Requires Node ≥ 20.19 (or any modern runtime with `fetch`). The package is ESM-only; on Node ≥ 20.19, `require("brex")` works too.

## Quickstart

```ts
import { Brex } from "brex";

const brex = new Brex({ token: process.env.BREX_TOKEN! });

// Typed responses
const me = await brex.users.getMe();

// Create with an auto-generated Idempotency-Key
const vendor = await brex.vendors.create({ company_name: "Acme Inc" });

// One page…
const page = await brex.expenses.list({ limit: 100 });

// …or every item across all pages
for await (const expense of brex.expenses.list({ "expand[]": ["merchant"] })) {
  console.log(expense.id);
}
```

Generate a user token in your Brex dashboard, or obtain one via OAuth.

## Tree-shakeable subpath imports

The root `Brex` class wires up all ten Brex APIs. If bundle size matters (browsers, edge functions), import only what you use — each subpath is an independent module graph:

```ts
import { createPaymentsClient } from "brex/payments";

const payments = createPaymentsClient({ token: process.env.BREX_TOKEN! });
const vendors = await payments.vendors.list({ name: "Acme" });
```

Every subpath also exports its resource classes (for composing with a shared `BrexCore`) and all of its schema types:

```ts
import type { VendorResponse, CreateVendorRequest } from "brex/payments";
import type { ExpandableExpense } from "brex/expenses";
```

## Pagination

Every list endpoint returns a `PagePromise` — await it for a single page, iterate it for items, or step through pages:

```ts
// Single page (respects your `cursor`/`limit` params)
const page = await brex.transactions.listPrimaryCard({ limit: 50 });

// All items, across pages — follows next_cursor automatically
for await (const tx of brex.transactions.listPrimaryCard()) { /* … */ }

// Page-by-page
for await (const p of brex.transactions.listPrimaryCard().pages()) { /* … */ }
```

## Authentication

Pass a static token, or a provider function (called per request — useful for OAuth token refresh):

```ts
const brex = new Brex({
  token: async () => getFreshAccessToken(),
});
```

## Options

```ts
const brex = new Brex({
  token: "…",
  baseUrl: "staging",          // "production" (default), "staging", or any URL
  fetch: myCustomFetch,         // inject for proxies, retries, or tests
  defaultHeaders: { "x-app": "my-app" },
});
```

Per-request options are the last argument of every method:

```ts
await brex.vendors.create(
  { company_name: "Acme Inc" },
  {
    idempotencyKey: "order-1234",          // else an UUID is auto-generated where required
    signal: AbortSignal.timeout(10_000),   // abort/timeout
    headers: { "x-trace-id": "abc" },
  },
);
```

Retries are intentionally out of scope — wrap the injected `fetch` if you need them.

## Error handling

Non-2xx responses throw a `BrexError`:

```ts
import { Brex, BrexError } from "brex";

try {
  await brex.vendors.get("vendor_id");
} catch (error) {
  if (error instanceof BrexError) {
    error.status;     // HTTP status code
    error.body;       // parsed JSON error body (or raw text)
    error.requestId;  // x-request-id header, if present
    error.headers;    // full response Headers
  }
}
```

## API reference

Namespaces and methods are derived deterministically from the specs' tags and operationIds (with a small, reviewed [overrides file](scripts/generate/overrides.ts)). Methods requiring an `Idempotency-Key` send one automatically. ~~Struck-through~~ methods are deprecated upstream.

<!-- generated:api-table:start -->

| Subpath import | Namespace | Methods |
| --- | --- | --- |
| `brex/accounting` | `accountingIntegrations` | `create`, `disconnect`, `reactivate` |
| `brex/accounting` | `accountingRecords` | `get`, `query`, `reportAccountingExportResults` |
| `brex/budgets` | `budgetPrograms` | `get`, `list` |
| `brex/budgets` | `budgetsV1` | `archive`, `create`, `get`, `list`, `update` |
| `brex/budgets` | `budgets` | `archive`, `create`, `get`, `list`, `update` |
| `brex/budgets` | `spendLimits` | `archive`, `create`, `get`, `list`, `update` |
| `brex/expenses` | `cardExpenses` | ~~`get`~~, ~~`list`~~, `update` |
| `brex/expenses` | `expenses` | `get`, `list` |
| `brex/expenses` | `receipts` | `match`, `upload` |
| `brex/fields` | `fieldValues` | `create`, `delete`, `get`, `list`, `update` |
| `brex/fields` | `fields` | `create`, `delete`, `get`, `list`, `update` |
| `brex/onboarding` | `referrals` | `createDocument`, `createRequest`, `get`, `list`, `processDelayedEINDocument` |
| `brex/payments` | `linkedAccounts` | `list` |
| `brex/payments` | `transfers` | `create`, `createIncoming`, `get`, `list` |
| `brex/payments` | `vendors` | `create`, `delete`, `get`, `list`, `update` |
| `brex/team` | `cards` | `create`, `emailNumber`, `get`, `getNumber`, `list`, `lock`, `terminate`, `unlock`, `update` |
| `brex/team` | `companies` | `get` |
| `brex/team` | `departments` | `create`, `get`, `list` |
| `brex/team` | `legalEntities` | `get`, `list` |
| `brex/team` | `locations` | `create`, `get`, `list` |
| `brex/team` | `titles` | `create`, `get`, `list` |
| `brex/team` | `users` | `create`, `get`, `getLimit`, `getMe`, `list`, `setLimit`, `update` |
| `brex/transactions` | `accounts` | `get`, `getPrimary`, `list`, `listCard`, `listCashStatements`, `listPrimaryCardStatements` |
| `brex/transactions` | `transactions` | `listCash`, `listPrimaryCard` |
| `brex/travel` | `trips` | `get`, `getBooking`, `list`, `listBookings` |
| `brex/webhooks` | `webhookGroups` | `addMembers`, `create`, `delete`, `get`, `list`, `listMembers`, `removeMembers` |
| `brex/webhooks` | `webhooks` | `create`, `delete`, `get`, `list`, `listSecrets`, `update` |

<!-- generated:api-table:end -->

Full request/response types for every method live in each subpath's exported schema types (e.g. `import type { VendorResponse } from "brex/payments"`), plus the raw `paths`/`components` OpenAPI shapes (`PaymentsPaths`, `PaymentsComponents`).

## How generation works

```
specs/*.yaml  ──bun run generate──▶  src/<api>/{types,schemas,client}.gen.ts + entries
```

- The 10 OpenAPI specs are **vendored byte-for-byte** in [`specs/`](specs) and re-fetched only by a human running `bun run sync-specs`.
- `bun run generate` is a **pure function** of the specs, the overrides file, and exactly-pinned tool versions. Running it twice produces byte-identical output.
- CI regenerates on every PR and **fails on drift**, so the published SDK can never silently diverge from the specs it claims to implement.
- Types come from [openapi-typescript](https://openapi-ts.dev); the thin client layer (~250 lines of hand-written runtime) is generated with method names cleaned from operationIds (`createVendor` → `vendors.create`).

To pick up upstream API changes: `bun run sync-specs && bun run generate`, review the diff, commit both.

## Migrating from v1

v2 is a ground-up rewrite; v1's hand-written wrapper is gone.

| v1 | v2 |
| --- | --- |
| `new Brex(token)` | `new Brex({ token })` |
| `brex.request({ endpoint, method, … })` | Typed methods, e.g. `brex.vendors.list()` |
| `brex.vendors.list()` (partial coverage) | Full coverage of all 10 published APIs |
| `isomorphic-unfetch` polyfill | Native `fetch`, zero dependencies |
| CommonJS + ESM | ESM-only (Node ≥ 20.19 `require()` still works) |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Releases are automated with [Changesets](https://github.com/changesets/changesets) and published to npm with provenance.

## License

[MIT](LICENSE)
