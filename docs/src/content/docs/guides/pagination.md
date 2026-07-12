---
title: Pagination
description: Await a page, iterate items, or step through pages with PagePromise.
---

Every list endpoint returns a `PagePromise` — await it for a single page,
iterate it for items, or step through pages.

```ts
// Single page (respects your `cursor`/`limit` params)
const page = await brex.transactions.listPrimaryCard({ limit: 50 });

// All items, across pages — follows next_cursor automatically
for await (const tx of brex.transactions.listPrimaryCard()) {
  /* … */
}

// Page-by-page
for await (const p of brex.transactions.listPrimaryCard().pages()) {
  /* … */
}
```

## How it works

A `PagePromise` is both a `Promise` (resolving to the first page) and an async
iterable. When you `for await` over it directly, it yields individual items and
transparently follows each response's `next_cursor` until the results are
exhausted. When you call `.pages()`, it yields whole page objects instead.

Because it is a real promise, you can `await` it anywhere you'd await a normal
request — nothing extra to import or configure.
