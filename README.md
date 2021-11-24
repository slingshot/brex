# Brex API Wrapper

This project is an unofficial JS wrapper for the Brex API, maintained by [Slingshot](https://github.com/slingshot). We use this library in production for managing payouts to artists on our platform.

This library is built in TypeScript and comes with built-in types. All requests use [isomorphic-unfetch](https://www.npmjs.com/package/isomorphic-unfetch) and should work both in Node and in browsers.

Install the package to get started:
```shell
npm install brex --save
# OR
yarn add brex
```

The full wrapper API reference can be found at [slingshot.github.io/brex](https://slingshot.github.io/brex/).

## Basic usage

Initialize an API instance using a user token, which you can generate in your Brex account dashboard (or via OAuth).

```typescript
import { Brex } from 'brex';

const brex = new Brex('{{YOUR USER TOKEN HERE}}');
```

You can then access any endpoint using the [request](https://slingshot.github.io/brex/classes/Brex.html#request) method, which wraps the API using your provided token. For example:

```typescript
const result = await brex.request({
    endpoint: 'vendors',
    method: 'GET',
    query: {
        name: 'Sanil Chawla',
    },
});
```

You can pass in a `query`, `body`, and/or `idempotencyKey` depending on your request. See the [ApiRequestOptions](https://slingshot.github.io/brex/interfaces/ApiRequestOptions.html) interface for more details.


## What's coming soon?

Version 1.0.0 will include a true JS wrapper that is semantically easier to use and handles typing across requests (for example, `brex.vendors.list()` or `brex.users.invite({...})`).

This functionality will be rolled out incrementally and tracked below. The `brex.request()` method will always remain accessible as well. Contributions are always welcome.

### Payments API

#### Vendors

- [x] `brex.vendors.list()`
- [ ] `brex.vendors.create()`
- [ ] `brex.vendors.get()`
- [ ] `brex.vendors.update()`
- [ ] `brex.vendors.delete()`

#### Transfers

- [ ] `brex.transfers.list()`
- [ ] `brex.transfers.create()`
- [ ] `brex.transfers.get()`

### Team API

#### Users

- [ ] `brex.users.list()`
- [ ] `brex.users.invite()`
- [ ] `brex.users.getCurrent()`
- [ ] `brex.users.get()`
- [ ] `brex.users.update()`
- [ ] `brex.users.getLimit()`
- [ ] `brex.users.setLimit()`

#### Locations

- [ ] `brex.locations.list()`
- [ ] `brex.locations.create()`
- [ ] `brex.locations.get()`

#### Departments

- [ ] `brex.departments.list()`
- [ ] `brex.departments.create()`
- [ ] `brex.departments.get()`

#### Cards

- [ ] `brex.cards.list()`
- [ ] `brex.cards.create()`
- [ ] `brex.cards.get()`
- [ ] `brex.cards.update()`
- [ ] `brex.cards.lock()`
- [ ] `brex.cards.getNumber()`
- [ ] `brex.cards.terminate()`
- [ ] `brex.cards.unlock()`

#### Companies

- [ ] `brex.companies.get()`

### Transactions API

#### Transactions

- [ ] `brex.transactions.listPrimaryCard()`
- [ ] `brex.transactions.listCash()`

#### Accounts

- [ ] `brex.accounts.listCards`
- [ ] `brex.accounts.listPrimaryCardStatements`
- [ ] `brex.accounts.listCash`
- [ ] `brex.accounts.listCashStatements`
