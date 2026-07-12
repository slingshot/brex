/**
 * Optional live smoke test against the real Brex API. Skipped unless a token
 * is provided; never runs in CI:
 *
 *   BREX_TOKEN=your_token bun test tests/live.smoke.test.ts
 */
import { describe, expect, test } from 'bun:test';
import { Brex } from '../src';

const token = process.env.BREX_TOKEN;

describe.skipIf(!token)('live API smoke', () => {
    // Constructed lazily: describe bodies run even when every test is skipped.
    const client = () => new Brex({ token: token as string });

    test('users.getMe returns the current user', async () => {
        const me = await client().users.getMe();
        expect(me.id).toBeTruthy();
    });

    test('expenses.list returns a page', async () => {
        const page = await client().expenses.list({ limit: 1 });
        expect(Array.isArray(page.items)).toBe(true);
    });
});
