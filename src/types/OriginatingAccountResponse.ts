/**
 * Originating account details for a transfer.
 */
export interface OriginatingAccountResponse {
    /**
     * The type of origin account; always `BREX_CASH` for now.
     */
    type: 'BREX_CASH',
    /**
     * ID of the Brex Cash account.
     */
    id: string,
}
