import { Money } from '../Money';

export interface CardAccount {
    /**
     * ID of the card account
     */
    id: string;
    /**
     * Account status (should be 'ACTIVE').
     */
    status?: string;
    /**
     * The current card balance.
     *
     * Money fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive).
     */
    current_balance?: Money;
    /**
     * The available balance.
     *
     * Money fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive).
     */
    available_balance?: Money;
    /**
     * The account limit.
     *
     * Money fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive).
     */
    account_limit?: Money;
    /**
     * The current statement period.
     */
    current_statement_period: {
        /** Start date */
        start_date: string,
        /** End date */
        end_date: string,
    }
}
