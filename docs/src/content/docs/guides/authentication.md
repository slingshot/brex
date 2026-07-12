---
title: Authentication
description: Pass a static token or a per-request provider function for OAuth refresh.
---

Pass a static token, or a provider function (called per request — useful for
OAuth token refresh).

```ts
import { Brex } from 'brex';

// Static token
const brex = new Brex({ token: process.env.BREX_TOKEN! });

// Provider function — called on every request
const brexOAuth = new Brex({
  token: async () => getFreshAccessToken(),
});
```

The provider form is awaited before each request, so you can return a cached
token and refresh it out of band, or fetch a fresh one on demand. Generate a
user token in your Brex dashboard, or obtain one via OAuth.

:::note
Keep tokens out of source control and client bundles. Most Brex API usage
involves highly sensitive financial data — you are responsible for securing it.
:::
