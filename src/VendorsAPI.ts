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
     * Lists all existing vendors for an account. Takes an optional parameter to match by vendor name.
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
     * Creates a new vendor.
     *
     * NOTE: You cannot currently create `INTERNATIONAL_WIRE` payment accountss through the API.
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
    * Gets a vendor by ID.
    */
    get = async (id: string): Promise<Vendor> => this.request({
        endpoint: `vendors/${id}`,
        method: 'GET',
    });

    /**
     * Updates an existing vendor by ID.
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
     * Deletes a vendor by ID.
     */
    delete = async (id: string): Promise<void> => {
        await this.request({
            endpoint: `vendors/${id}`,
            method: 'DELETE',
        });
    };
}
