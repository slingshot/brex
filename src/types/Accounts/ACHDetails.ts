import { BankAccountType } from './BankAccountType';
import { BankAccountClass } from './BankAccountClass';

/**
 * Details for a vendor's ACH payment account
 */
export interface ACHDetails {
    /** ACH routing number */
    routing_number: string,
    /** ACH account number */
    account_number: string,
    /** ACH account type (see {@link BankAccountType} enum) */
    account_type: BankAccountType,
    /** ACH account class (see {@link BankAccountClass} enum) */
    account_class: BankAccountClass,
}
