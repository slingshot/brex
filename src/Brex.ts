import fetch from 'isomorphic-unfetch';
import {
    ApiOptions,
    Vendor,
    ApiListResponse,
    ApiRequestOptions,
    PaymentAccountDetails, ApiError,
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
     * @param options - Additional options (see {@link ApiOptions}).
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
     * @param options - See {@link ApiRequestOptions}.
     */
    request = async (
        {
            endpoint,
            method,
            query,
            body,
            idempotency_key = uuid(),
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

    vendors = {
        /**
         * List vendors (`GET /vendors`)
         */
        list: async (
            options: {
                /** The current cursor for paginated results */
                cursor?: string;
                /** The desired number of results per page */
                limit?: number;
                /** A query for listed vendors by their name */
                name?: string;
            } = {},
        ): Promise<ApiListResponse<Vendor>> => this.request({
            endpoint: 'vendors',
            method: 'GET',
            query: {
                ...options,
            },
        }),
        /**
         * Create vendors (`POST /vendors`)
         */
        create: async (options: {
            company_name: string,
            email?: string,
            phone?: string,
            payment_accounts?: PaymentAccountDetails[],
            idempotency_key?: string,
        }): Promise<Vendor> => {
            const { idempotency_key, ...body } = options;
            return this.request({
                endpoint: 'vendors',
                method: 'POST',
                body: {
                    ...body,
                    payment_accounts: options.payment_accounts?.map((details) => ({
                        details,
                    })) ?? [],
                },
                idempotency_key,
            });
        },
    };
}
