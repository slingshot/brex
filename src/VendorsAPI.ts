import {
    ApiListResponse, ApiRequestOptions, PaymentAccountDetails, Vendor,
} from './types';

/**
 * Queries to the Vendors endpoints of the Payments API.
 */
export class VendorsAPI {
    request: (options: ApiRequestOptions) => Promise<any>;

    constructor(
        request: (options: ApiRequestOptions) => Promise<any>,
    ) {
        this.request = request;
    }

    /**
     * List vendors (`GET /vendors`)
     */
    list = async (
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
    });

    /**
     * Create vendors (`POST /vendors`)
     */
    create = async (options: {
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
    };

    /**
 * Get a specific vendor by ID (`GET /vendors/{id}`)
 */
    get = async (id: string): Promise<Vendor> => this.request({
        endpoint: `vendors/${id}`,
        method: 'GET',
    });

    /**
     * Update a vendor (`PUT /vendors/{id}`)
     */
    update = async (
        id: string,
        options: {
            company_name?: string,
            email?: string,
            phone?: string,
            payment_accounts?: PaymentAccountDetails[],
            idempotency_key?: string,
        },
    ): Promise<Vendor> => {
        const { idempotency_key, ...body } = options;
        return this.request({
            endpoint: `vendors/${id}`,
            method: 'PUT',
            body: {
                ...body,
                payment_accounts: options.payment_accounts?.map((details) => ({
                    details,
                })) ?? [],
            },
            idempotency_key,
        });
    };

    /**
     * Delete a vendor (`DELETE /vendors/{id}`)
     */
    delete = async (id: string): Promise<void> => {
        await this.request({
            endpoint: `vendors/${id}`,
            method: 'DELETE',
        });
    };
}
