import { Address } from '../Address';

export interface DomesticWirePaymentDetails {
    routing_number: string,
    account_number: string,
    address: Address,
}
