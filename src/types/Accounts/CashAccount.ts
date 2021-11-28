import { Money } from '../Money';

/**
 * Details of a Brex Cash account.
 */
export interface CashAccount {
    /**
     * ID of the cash account.
     */
    id: string;
    /**
     * Name of the cash account
     */
    name: string;
    /**
     * Status of the cash account (usually `ACTIVE`).
     */
    status?: string;
    /**
     * Current balance of the cash account.
     *
     * Money fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive).
     */
    current_balance: Money;
    /**
     * Available balance of the cash account.
     *
     * Money fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive).
     */
    available_balance: Money;
    /**
     * Account number.
     */
    account_number: string;
    /**
     * Routing number.
     */
    routing_number: string;
}
