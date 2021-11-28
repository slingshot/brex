import fetch from 'isomorphic-unfetch';
import { uuid } from './uuid';
import { ApiError, ApiRequestOptions } from '../types';

/**
 * Conduct a raw request to any Brex API endpoint outside of a {@link Brex} instance.
 * @param token - Your user token.
 * @param baseURL - The base URL (usually `https://platform.brexapis.com`).
 * @param options - See {@link ApiRequestOptions}.
 */
export const apiRequest = async (
    token: string,
    baseURL: string,
    {
        endpoint,
        method,
        query,
        body,
        apiVersion = 'v1',
        idempotency_key = uuid(),
    }: ApiRequestOptions,
) => {
    if (!endpoint) throw new Error('Must provide an endpoint for request');
    if (!token) throw new Error('Brex API instance must be initialized with a user token');

    // Turn the query into url parameters
    let queryUrlParams = '';
    if (query && Object.keys(query).length > 0) {
        queryUrlParams = `?${(new URLSearchParams(Object.fromEntries(
            Object
                .entries(query)
                .filter((p) => !!p[1]),
        ))).toString()}`;
    }
    const res = await fetch(
        `${baseURL}/${apiVersion}/${endpoint}${queryUrlParams}`,
        {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Idempotency-Key': idempotency_key,
            },
            body: JSON.stringify(body),
        },
    );
    if (res.ok) {
        return res.json();
    }
    throw new ApiError({
        status: res.status,
        message: res.statusText,
        response: await res.json() || await res.text(),
    });
};
