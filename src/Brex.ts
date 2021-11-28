import {
    ApiOptions,
    ApiRequestOptions,
} from './types';
import { apiRequest } from './util/apiRequest';
import { VendorsAPI } from './VendorsAPI';
import { TransfersAPI } from './TransfersAPI';
import { AccountsAPI } from './AccountsAPI';

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
        options: ApiRequestOptions,
    ) => apiRequest(
        this.token,
        this.baseURL,
        options,
    );

    /**
     * Payments API: Vendors endpoints
     */
    vendors = new VendorsAPI(this.request);

    /**
     * Payments API: Transfers endpoints
     */
    transfers = new TransfersAPI(this.request);

    /**
     * Transactions API: Accounts endpoints
     */
    accounts = new AccountsAPI(this.request);
}
