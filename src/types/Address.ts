/**
 * A mailing address.
 */
export interface Address {
    /** Address line 1, no PO Box. */
    line1?: string;
    /** Address line 2 (e.g., apartment, suite, unit, or building). */
    line2?: string;
    /** City, district, suburb, town, or village. */
    city?: string;
    /** For US addresses: the 2-letter State abbreviation. For international addresses: the county, providence, or region. */
    state?: string;
    /** Two-letter country code (ISO 3166-1 alpha-2). **MUST be a US-based address for checks.** */
    country?: string;
    /** ZIP or postal code. */
    postal_code?: string;
    /** Phone number. */
    phone_number?: string;
}
