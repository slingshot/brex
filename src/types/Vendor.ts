import { PaymentAccountResponse } from './Accounts/PaymentAccountResponse';

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
    company_name?: string;
    /**
     * A contact email for the vendor.
     */
    email?: string;
    /**
     * A contact phone number for the vendor.
     */
    phone?: string;
    /**
     * A list of payment accounts associated with the vendor.
     */
    payment_accounts?: PaymentAccountResponse[];
}
