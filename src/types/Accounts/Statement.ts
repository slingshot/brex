import { Money } from '../Money';

export interface Statement {
    /** The statement ID */
    id: string;
    /**
     * The balance at the start of this period.
     *
     * Money fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive).
     */
    start_balance?: Money;
    /**
     * The balance at the end of this period.
     *
     * Money fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive).
     */
    end_balance?: Money;
    /**
     * The time period for this statement.
     */
    period: {
        /** Start date of the statement period. */
        start_date: string;
        /** End date of the statement period. */
        end_date: string;
    }
}
