/**
 * Originating account details for a transfer.
 */
export interface OriginatingAccount {
    /**
     * The type of originating account. Always `BREX_CASH` for now.
     */
    type: 'BREX_CASH',
    /**
     * ID of the Brex Cash account: Can be found from the `brex.accounts` endpoint where instrument type is `CASH`.
     */
    id: string,
}
