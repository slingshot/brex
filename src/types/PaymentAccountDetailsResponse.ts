import { PaymentDetailsTypeResponse } from './PaymentDetailsTypeResponse';
import { Address } from './Address';

/**
 * A response containing details for a specific payment account.
 */
export interface PaymentAccountDetailsResponse {
    /**
     * The type of transfer for this payment account.
     */
    type: PaymentDetailsTypeResponse;
    /**
     * Payment Instrument ID that can be passed to the /transfers endpoint to trigger a transfer. The type of the payment instrument dictates the method.
     */
    paymentInstrumentId: string;
    /**
     * The routing number for this account.
     */
    routingNumber: string;
    /**
     * The account number for this account.
     */
    accountNumber: string;
    /**
     * Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).
     */
    address: Address;
}
