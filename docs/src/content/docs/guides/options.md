---
title: Client & request options
description: Configure base URL, a custom fetch, default headers, idempotency, and abort signals.
---

## Client options

```ts
const brex = new Brex({
  token: '…',
  baseUrl: 'staging',            // "production" (default), "staging", or any URL
  fetch: myCustomFetch,          // inject for proxies, retries, or tests
  defaultHeaders: { 'x-app': 'my-app' },
});
```

- **`baseUrl`** — `"production"` (default), `"staging"`, or any absolute URL.
- **`fetch`** — inject your own `fetch` implementation for proxies, retries,
  logging, or tests. The SDK only relies on the web-standard `fetch` signature.
- **`defaultHeaders`** — merged into every request.

## Per-request options

Per-request options are the last argument of every method:

```ts
await brex.vendors.create(
  { company_name: 'Acme Inc' },
  {
    idempotencyKey: 'order-1234',          // else a UUID is auto-generated where required
    signal: AbortSignal.timeout(10_000),   // abort / timeout
    headers: { 'x-trace-id': 'abc' },
  },
);
```

- **`idempotencyKey`** — sets the `Idempotency-Key` header. Where Brex requires
  one and you don't provide it, a UUID is generated automatically.
- **`signal`** — an `AbortSignal` for cancellation or timeouts.
- **`headers`** — per-request header overrides.

:::note
Retries are intentionally out of scope — wrap the injected `fetch` if you need
them.
:::
