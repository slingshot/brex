import fetch from 'isomorphic-unfetch';
import {
    ApiOptions, Vendor, ApiListRequest, ApiListResponse,
} from './types';

/**
 * A Brex API instance.
 */
export class Brex {
    /**
     * The authorization header string, in the format `Bearer {{user token here}}`.
     */
    authorizationHeader: string;

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
        this.authorizationHeader = `Bearer ${token}`;
        this.baseURL = options?.baseURL || 'https://platform.brexapis.com';
        this.apiVersion = options?.apiVersion || 'v1';
    }

    vendors = {
        list: async (
            {
                cursor,
                limit,
                name,
            }: ApiListRequest = {},
        ): Promise<ApiListResponse<Vendor>> => {
            const { authorizationHeader, baseURL, apiVersion } = this;
            let url = `${baseURL}/${apiVersion}/vendors`;
            if (!!cursor || !!limit || !name) {
                url += '?';
                const queries = { cursor, limit, name };
                url += Object.values(queries)
                    .map((q, i) => {
                        if (q) return `${Object.keys(queries)[i]}=${encodeURIComponent(q)}`;
                        return '';
                    })
                    .filter(Boolean)
                    .join('&');
            }
            const res = await fetch(
                url,
                {
                    method: 'GET',
                    headers: {
                        Authorization: authorizationHeader,
                    },
                },
            );
            if (res.ok) {
                return res.json();
            }
            throw new Error(`Received error ${res.status} ${res.statusText} ${await res.text()}`);
        },
    };
}
