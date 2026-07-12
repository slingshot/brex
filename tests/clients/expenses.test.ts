import { describe, expect, test } from 'bun:test';
import { createExpensesClient } from '../../src/expenses';
import { fetchMock, jsonResponse } from '../helpers';

describe('generated expenses client', () => {
    test('expenses.list auto-paginates across three pages', async () => {
        const { fetch, calls } = fetchMock(
            () => jsonResponse({ next_cursor: 'c2', items: [{ id: 'e1' }, { id: 'e2' }] }),
            () => jsonResponse({ next_cursor: 'c3', items: [{ id: 'e3' }] }),
            () => jsonResponse({ next_cursor: null, items: [{ id: 'e4' }] }),
        );
        const expenses = createExpensesClient({ token: 'tok', fetch });

        const ids: string[] = [];
        for await (const expense of expenses.expenses.list({ 'expand[]': ['merchant'] })) {
            ids.push(expense.id);
        }

        expect(ids).toEqual(['e1', 'e2', 'e3', 'e4']);
        expect(calls.map((c) => c.url)).toEqual([
            'https://api.brex.com/v1/expenses?expand%5B%5D=merchant',
            'https://api.brex.com/v1/expenses?expand%5B%5D=merchant&cursor=c2',
            'https://api.brex.com/v1/expenses?expand%5B%5D=merchant&cursor=c3',
        ]);
    });

    test('awaiting expenses.list returns just the first page', async () => {
        const { fetch, calls } = fetchMock(() =>
            jsonResponse({ next_cursor: 'c2', items: [{ id: 'e1' }] }),
        );
        const expenses = createExpensesClient({ token: 'tok', fetch });

        const page = await expenses.expenses.list();

        expect(page.items?.map((e) => e.id)).toEqual(['e1']);
        expect(page.next_cursor).toBe('c2');
        expect(calls.length).toBe(1);
    });

    test('receipts.match posts to the receipt_match endpoint (201 response)', async () => {
        const { fetch, calls } = fetchMock(() => jsonResponse({ id: 'r1', uri: 's3://...' }, 201));
        const expenses = createExpensesClient({ token: 'tok', fetch });

        const receipt = await expenses.receipts.match({ receipt_name: 'receipt.pdf' });

        expect(receipt.id).toBe('r1');
        expect(calls[0]?.url).toBe('https://api.brex.com/v1/expenses/card/receipt_match');
        expect(calls[0]?.init.method).toBe('POST');
    });
});
