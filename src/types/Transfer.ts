import { CounterpartyResponse } from './Counterparty';
import { PaymentAccountType } from './Transfers/PaymentAccountType';
import { Money } from './Money';
import { OriginatingAccountResponse } from './OriginatingAccountResponse';
import { TransferStatus } from './TransferStatus';

export interface Transfer {
    /**
     * Unique ID associated with the transfer.
     * */
    id: string,
    /**
     * Counterparty details for the transfer - Currently only supports vendors that are returned in the response from the /vendors endpoint BOOK_TRANSFER is a limited feature. Please reach out if you are interested.
     */
    counterparty?: CounterpartyResponse,
    /**
     * Description of the transfer.
     */
    description?: string,
    /**
     * The payment account type.
     */
    payment_type: PaymentAccountType,
    /**
     * Money fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive).
     */
    amount: Money,
    /**
     * Transaction processing date
     */
    process_date?: string,
    /**
     * Originating account details for the transfer
     */
    originating_account: OriginatingAccountResponse,
    /**
     * Transfer status (see {@link TransferStatus} enum for possible statuses and details on each).
     */
    status: TransferStatus,
    /**
     * Estimated delivery date for transfer.
     */
    estimated_delivery_date?: string,
    /**
     * User ID of the transfer initiator.
     */
    creator_user_id?: string,
    /**
     * Date of transfer creation.
     */
    created_at?: string,
}
