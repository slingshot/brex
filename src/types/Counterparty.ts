export enum CounterpartyType {
    BOOK_TRANSFER = 'BOOK_TRANSFER',
    VENDOR = 'VENDOR',
}

export type BookTransferPaymentInstrumentID = {
    /**
     * Payment Instrument ID of the receiving Brex account. This payment instrument must belong to a Brex account. This feature is currently limited to certain customers, please reach out if you are interested
     */
    payment_instrument_id: string,
};

export type VendorPaymentInstrumentID = {
    /**
     * ID of the vendor's payment instrument: this will dictate the payment method and the counterparty of the transaction. The payment instrument ID is returned from the `brex.vendors` response and the type of the instrument will dictate the payment method. eg. Passing an instrument ID of type ACH will trigger an ACH payment to the associated vendor. Since a payment instrument can be updated while retaining the same `payment_instrument_id`, please make sure to double check the details.
     */
    payment_instrument_id: string,
};

/**
 * Counterparty details for a transfer.
 */
export type Counterparty =
    |
    {
        /**
         * Counterparty type.
         */
        type: CounterpartyType.BOOK_TRANSFER,
        /**
         * Payment Instrument ID of the receiving Brex account. This payment instrument must belong to a Brex account. This feature is currently limited to certain customers, please reach out if you are interested
         */
        payment_instrument_id: string,
    }
    |
    {
        /**
         * Counterparty type.
         */
        type: CounterpartyType.VENDOR,
        /**
         * ID of the vendor's payment instrument: this will dictate the payment method and the counterparty of the transaction. The payment instrument ID is returned from the `brex.vendors` response and the type of the instrument will dictate the payment method. eg. Passing an instrument ID of type ACH will trigger an ACH payment to the associated vendor. Since a payment instrument can be updated while retaining the same `payment_instrument_id`, please make sure to double check the details.
         */
        payment_instrument_id: string,
    };

/**
 * Counterparty details for the transfer - Currently only supports vendors that are returned in the response from the `brex.vendors` response.
 *
 * `BOOK_TRANSFER` is a limited feature. Please reach out to Brex if you are interested.
 */
export type CounterpartyResponse =
    |
    {
        /**
         * Counterparty type.
         */
        type: CounterpartyType.VENDOR,
        /**
         * Vendor ID returned from a `brex.vendors` response.
         */
        id: string,
        /**
         * ID of the vendor's payment instrument.
         */
        payment_instrument_id: string,
    }
    |
    {
        /**
         * Counterparty type.
         */
        type: CounterpartyType.BOOK_TRANSFER,
        /**
         * This feature is currently limited to certain customers, please reach out to Brex if you are interested.
         */
        deposit_account_id: string,
    };
