import { Address } from '../Address';

export interface ChequePaymentDetails {
    mailing_address: Address,
    recipient_name: string,
}
