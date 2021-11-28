/**
 * The current statuses possible for a transfer.
 */
export enum TransferStatus {
    /**
     * We have started to process the sending or receiving of this transaction.
     */
    PROCESSING = 'PROCESSING',
    /**
     * The transaction is scheduled to enter the `PROCESSING` status.
     */
    SCHEDULED = 'SCHEDULED',
    /**
     * The transaction requires approval before it can enter the `SCHEDULED` or `PROCESSING` status.
     */
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    /**
     * A grouping of multiple terminal states that prevented the transaction from completing. This includes a a user-cancellation, approval being denied, insufficient funds, failed verifications, etc.
     */
    FAILED = 'FAILED',
    /**
     * The money movement has been fully completed, which could mean money sent has arrived.
     */
    PROCESSED = 'PROCESSED',
}
