---
title: Tree-shakeable imports
description: Import only the Brex APIs you use via per-API subpaths.
---

The root `Brex` class wires up all ten Brex APIs. If bundle size matters
(browsers, edge functions), import only what you use — each subpath is an
independent module graph, so the other nine APIs never enter your bundle
(about 3.5&nbsp;kB min for a single API).

```ts
import { createPaymentsClient } from 'brex/payments';

const payments = createPaymentsClient({ token: process.env.BREX_TOKEN! });
const vendors = await payments.vendors.list({ name: 'Acme' });
```

Every subpath also exports its resource classes (for composing with a shared
`BrexCore`) and all of its schema types:

```ts
import type { VendorResponse, CreateVendorRequest } from 'brex/payments';
import type { ExpandableExpense } from 'brex/expenses';
```

## Available subpaths

Each subpath maps to one vendored OpenAPI spec:

| Subpath | Client factory |
| --- | --- |
| `brex/accounting` | `createAccountingClient` |
| `brex/budgets` | `createBudgetsClient` |
| `brex/expenses` | `createExpensesClient` |
| `brex/fields` | `createFieldsClient` |
| `brex/onboarding` | `createOnboardingClient` |
| `brex/payments` | `createPaymentsClient` |
| `brex/team` | `createTeamClient` |
| `brex/transactions` | `createTransactionsClient` |
| `brex/travel` | `createTravelClient` |
| `brex/webhooks` | `createWebhooksClient` |

For the exact namespaces and methods under each, see the
[API reference](/brex/api/readme/).
