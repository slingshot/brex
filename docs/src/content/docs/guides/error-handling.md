---
title: Error handling
description: Non-2xx responses throw a typed BrexError with status, body, requestId, and headers.
---

Non-2xx responses throw a `BrexError`:

```ts
import { Brex, BrexError } from 'brex';

try {
  await brex.vendors.get('vendor_id');
} catch (error) {
  if (error instanceof BrexError) {
    error.status;     // HTTP status code
    error.body;       // parsed JSON error body (or raw text)
    error.requestId;  // x-request-id header, if present
    error.headers;    // full response Headers
  }
}
```

## `BrexError` fields

| Field | Type | Description |
| --- | --- | --- |
| `status` | `number` | The HTTP status code of the failed response. |
| `body` | `unknown` | The parsed JSON error body, or the raw text if it wasn't JSON. |
| `requestId` | `string \| undefined` | The `x-request-id` header, if present — quote it in Brex support requests. |
| `headers` | `Headers` | The full response `Headers`. |

Anything that isn't a `BrexError` (network failures, aborts) propagates as its
native error type, so you can distinguish transport problems from API errors.
