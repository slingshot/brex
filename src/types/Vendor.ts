import { PaymentAccountResponse } from './PaymentAccountResponse';

/**
 * A Brex account vendor.
 */
export interface Vendor {
    /**
     * Vendor ID: Can be passed to /transfers endpoint to specify counterparty.
     */
    id: string;
    /**
     * The name of the vendor's company.
     */
    companyName: string | null;
    /**
     * A contact email for the vendor.
     */
    email: string | null;
    /**
     * A contact phone number for the vendor.
     */
    phone: string | null;
    /**
     * A list of payment accounts associated with the vendor.
     */
    paymentAccounts: PaymentAccountResponse[] | null;
}
