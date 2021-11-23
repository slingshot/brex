import { PaymentAccountDetailsResponse } from './PaymentAccountDetailsResponse';

/**
 * An API response for payment accounts.
 */
export interface PaymentAccountResponse {
    /**
     * The account details.
     */
    details: PaymentAccountDetailsResponse;
}
