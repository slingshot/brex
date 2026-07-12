import { describe, expect, test } from 'bun:test';
import { createPaymentsClient } from '../../src/payments';
import { emptyResponse, fetchMock, jsonResponse } from '../helpers';

describe('generated payments client', () => {
    test('vendors.create sends POST with body, auth, and auto idempotency key', async () => {
        const { fetch, calls } = fetchMock(() => jsonResponse({ id: 'v1', company_name: 'Acme' }));
        const payments = createPaymentsClient({ token: 'tok', fetch });

        const vendor = await payments.vendors.create({ company_name: 'Acme' });

        expect(vendor).toEqual({ id: 'v1', company_name: 'Acme' });
        expect(calls[0]?.url).toBe('https://api.brex.com/v1/vendors');
        expect(calls[0]?.init.method).toBe('POST');
        expect(calls[0]?.body).toBe('{"company_name":"Acme"}');
        expect(calls[0]?.headers.get('authorization')).toBe('Bearer tok');
        expect(calls[0]?.headers.get('idempotency-key')).toBeTruthy();
    });

    test('vendors.get URL-encodes the path param', async () => {
        const { fetch, calls } = fetchMock(() => jsonResponse({ id: 'weird/id' }));
        const payments = createPaymentsClient({ token: 'tok', fetch });

        await payments.vendors.get('weird/id');

        expect(calls[0]?.url).toBe('https://api.brex.com/v1/vendors/weird%2Fid');
    });

    test('vendors.delete resolves undefined on an empty 200', async () => {
        const { fetch, calls } = fetchMock(() => emptyResponse());
        const payments = createPaymentsClient({ token: 'tok', fetch });

        const result = await payments.vendors.delete('v1');

        expect(result).toBeUndefined();
        expect(calls[0]?.init.method).toBe('DELETE');
    });

    test('vendors.list forwards query params', async () => {
        const { fetch, calls } = fetchMock(() => jsonResponse({ next_cursor: null, items: [] }));
        const payments = createPaymentsClient({ token: 'tok', fetch });

        await payments.vendors.list({ name: 'Acme', limit: 10 });

        expect(calls[0]?.url).toBe('https://api.brex.com/v1/vendors?name=Acme&limit=10');
    });
});
