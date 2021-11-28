import {
    ApiListResponse, ApiRequestOptions, Counterparty, Money, OriginatingAccount, Transfer,
} from './types';

export class TransfersAPI {
    request: (options: ApiRequestOptions) => Promise<any>;

    constructor(
        request: (options: ApiRequestOptions) => Promise<any>,
    ) {
        this.request = request;
    }

    /**
     * Lists existing transfers for an account.
     *
     * Currently, the API can only return transfers for the following payment rails:
     * - `ACH`
     * - `DOMESTIC_WIRE`
     * - `CHEQUE`
     * - `INTERNATIONAL_WIRE`
     */
    list = async (
        options: {
            /** The current cursor for paginated results */
            cursor?: string;
            /** The desired number of results per page */
            limit?: number;
        } = {},
    ): Promise<ApiListResponse<Transfer>> => this.request({
        endpoint: 'transfers',
        method: 'GET',
        query: {
            ...options,
        },
    });

    /**
     * Creates a new transfer.
     *
     * Currently, the API can only create transfers for the following payment rails:
     * - ACH
     * - DOMESTIC_WIRE
     * - CHEQUE
     * - INTERNATIONAL_WIRES (For vendors already created through dashboard. Rate limited to 100/day - Please reach out to developer-support@brex.com if you need to do more)
     *
     * Reminder: You may not use the Brex API for any activity that requires a license or registration from any governmental authority without Brex's prior review and approval. This includes but is not limited to any money services business or money transmission activity.
     * Please review the [Brex Access Agreement](https://www.brex.com/legal/developer-portal/) and contact Brex if you have any questions.
     *
     * @param options - Details for the created transfer.
     */
    create = async (
        options: {
            /** The {@link Counterparty} for this transfer. */
            counterparty: Counterparty,
            /**
             * The amount (as a {@link Money} object) for this transfer.
             *
             * Money fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive).
             * */
            amount: Money,
            /** Description of the transfer for internal use. Not exposed externally. */
            description: string,
            /**
             * External memo for the transfer (`Payment Instructions` for Wires; the `Entry Description` for ACH payments; or the memo line for checks).
             *
             * Max 90 characters for `ACH` and `WIRE` transactions and max 40 characters for `CHEQUE`s.
             */
            external_memo: string,
            /**
             * {@link OriginatingAccount} details for the transfer.
             */
            originating_account: OriginatingAccount,
            /**
             * An idempotency key for this request. By default, a UUID is generated, but you should provide your own and integrate properly to ensure proper error handling and true idempotency.
             */
            idempotency_key?: string,
        },
    ): Promise<Transfer> => {
        const { idempotency_key, ...body } = options;
        return this.request({
            endpoint: 'transfers',
            method: 'POST',
            body,
        });
    };

    /**
     * Gets a transfer by ID.
     *
     * @param id - The transfer ID
     */
    get = async (id: string): Promise<Transfer> => this.request({
        endpoint: `transfers/${id}`,
        method: 'GET',
    });
}
