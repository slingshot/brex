---
title: Quickstart
description: Create a Brex client and make your first typed, paginated requests.
---

Create a client with a token, then call typed methods. The root `Brex` class
wires up all ten Brex APIs behind a single object.

```ts
import { Brex } from 'brex';

const brex = new Brex({ token: process.env.BREX_TOKEN! });

// Typed responses
const me = await brex.users.getMe();

// Create with an auto-generated Idempotency-Key
const vendor = await brex.vendors.create({ company_name: 'Acme Inc' });

// One page…
const page = await brex.expenses.list({ limit: 100 });

// …or every item across all pages
for await (const expense of brex.expenses.list({ 'expand[]': ['merchant'] })) {
  console.log(expense.id);
}
```

Generate a user token in your Brex dashboard, or obtain one via OAuth. See
[Authentication](/brex/guides/authentication/) for token providers and OAuth
refresh.

## Where to go next

- [Tree-shakeable imports](/brex/guides/subpath-imports/) — import only the APIs you
  use.
- [Pagination](/brex/guides/pagination/) — pages vs. items vs. cursors.
- [Client & request options](/brex/guides/options/) — base URL, custom `fetch`,
  per-request headers, idempotency, and abort signals.
- [Error handling](/brex/guides/error-handling/) — the `BrexError` shape.
- [API reference](/brex/api/readme/) — every namespace, method, and type.
