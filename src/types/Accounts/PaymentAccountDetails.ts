import { ACHDetails } from './ACHDetails';
import { DomesticWirePaymentDetails } from './DomesticWirePaymentDetails';
import { ChequePaymentDetails } from './ChequePaymentDetails';
import { PaymentAccountType } from './PaymentAccountType';

/**
 * Payment account details for a given {@link PaymentAccountType}
 */
export type PaymentAccountDetails =
    | { type: PaymentAccountType.ACH } & ACHDetails
    | { type: PaymentAccountType.DOMESTIC_WIRE } & DomesticWirePaymentDetails
    | { type: PaymentAccountType.CHEQUE } & ChequePaymentDetails;
