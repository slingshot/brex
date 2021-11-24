# Brex API Wrapper for JavaScript

This project is an unofficial JS wrapper for the Brex API, maintained by [Slingshot](https://github.com/slingshot). **This is a work in progress.**

This library is built in TypeScript and comes with built-in types. All requests use [isomorphic-unfetch](https://www.npmjs.com/package/isomorphic-unfetch) and should work both in Node and in browsers.

Install the package to get started:
```shell
npm install brex --save
# OR
yarn add brex
```

## Basic usage

Initialize an API instance using a user token, which you can generate in your Brex account dashboard.

```typescript
import { Brex } from 'brex';

const brex = new Brex('{{YOUR USER TOKEN HERE}}');
```

## Current functionality

- Payments API: Vendors (WIP)


## What's coming soon?

- Payments API: Transfers
- Comprehensive tests
- Team API
- Transactions API
- Onboarding API
