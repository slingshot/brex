import {
    ApiListResponse, ApiRequestOptions, CardAccount, Statement, CashAccount,
} from './types';

/**
 * The `/accounts` endpoints of the Brex Transactions API.
 */
export class AccountsAPI {
    request: (options: ApiRequestOptions) => Promise<any>;

    constructor(
        request: (options: ApiRequestOptions) => Promise<any>,
    ) {
        this.request = request;
    }

    /**
     * Lists all accounts of card type.
     */
    listCardAccounts = async (): Promise<CardAccount[]> => this.request({
        endpoint: 'accounts/card',
        method: 'GET',
        apiVersion: 'v2',
    });

    /**
     * Lists all finalized statements for the primary card account.
     */
    listPrimaryCardStatements = async (
        options: {
            /** The current cursor for paginated results */
            cursor?: string;
            /** The desired number of results per page */
            limit?: number;
        } = {},
    ): Promise<ApiListResponse<Statement>> => this.request({
        endpoint: 'accounts/card/primary/statements',
        method: 'GET',
        query: {
            ...options,
        },
        apiVersion: 'v2',
    });

    /**
     * Lists all the existing cash accounts with their status.
     */
    listCashAccounts = async (): Promise<ApiListResponse<CashAccount>> => this.request({
        endpoint: 'accounts/cash',
        method: 'GET',
        apiVersion: 'v2',
    });

    /**
     * Lists all finalized statements for the cash account by ID.
     */
    listCashStatements = async (
        /** The Cash account ID (as found with `brex.accounts.listCashAccounts()`). */
        id: string,
        options: {
            /** The current cursor for paginated results */
            cursor?: string;
            /** The desired number of results per page */
            limit?: number;
        } = {},
    ): Promise<ApiListResponse<Statement>> => this.request({
        endpoint: `accounts/cash/${id}/statements`,
        method: 'GET',
        query: {
            ...options,
        },
        apiVersion: 'v2',
    });
}
