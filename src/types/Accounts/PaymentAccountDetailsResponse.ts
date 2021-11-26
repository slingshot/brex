import { PaymentAccountDetails } from './PaymentAccountDetails';

/**
 * A response containing details for a specific payment account.
 */
export type PaymentAccountDetailsResponse = {
    /**
     * Payment Instrument ID that can be passed to the /transfers endpoint to trigger a transfer. The type of the payment instrument dictates the method.
     */
    payment_instrument_id: string;
} & PaymentAccountDetails;
