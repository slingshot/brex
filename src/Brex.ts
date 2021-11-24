import fetch from 'isomorphic-unfetch';
import {
    ApiOptions, Vendor, ApiListRequest, ApiListResponse, ApiRequestOptions,
} from './types';
import { uuid } from './util/uuid';

/**
 * A Brex API instance.
 */
export class Brex {
    /**
     * The user auth token.
     */
    token: string;

    /**
     * The base URL for this API instance. Generally, this will always be `https://platform.brexapis.com`.
     */
    baseURL: string;

    /**
     * The version of the Brex API to be used; defaults to `v1`.
     */
    apiVersion: string;

    /**
     * Constructs a Brex API instance.
     * @param token - Your Brex API user token.
     * @param options - Additional options (see [[ApiOptions]]).
     */
    constructor(
        token: string,
        options?: ApiOptions,
    ) {
        this.token = token;
        this.baseURL = options?.baseURL || 'https://platform.brexapis.com';
        this.apiVersion = options?.apiVersion || 'v1';
    }

    /**
     * A generic request function for accessing the Brex API.
     * @param options - See [[ApiRequestOptions]].
     */
    request = async (
        {
            endpoint,
            method,
            query,
            body,
            idempotencyKey = uuid(),
        }: ApiRequestOptions,
    ) => {
        if (!endpoint) throw new Error('Must provide an endpoint for request');
        if (!this.token) throw new Error('Brex API instance must be initialized with a user token');

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
            `${this.baseURL}/${this.apiVersion}/${endpoint}${queryUrlParams}`,
            {
                method,
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Idempotency-Key': idempotencyKey,
                },
                body,
            },
        );
        if (res.ok) {
            return res.json();
        }
        throw new Error(`Received error ${res.status} ${res.statusText} ${await res.text()}`);
    };

    vendors = {
        list: async (
            {
                cursor,
                limit,
                name,
            }: ApiListRequest = {},
        ): Promise<ApiListResponse<Vendor>> => this.request({
            endpoint: 'vendors',
            method: 'GET',
            query: {
                cursor,
                limit,
                name,
            },
        }),
    };
}
