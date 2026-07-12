/**
 * Single source of truth for the Brex OpenAPI specs this SDK is generated from.
 *
 * `id` doubles as the spec filename (`specs/<id>.yaml`), the source directory
 * (`src/<id>/`), and the package subpath export (`brex/<id>`).
 */
export interface SpecConfig {
    readonly id: string;
    readonly url: string;
}

const SPEC_URL = (slug: string) =>
    `https://developer.brex.com/_bundle/openapi/${slug}_api.yaml?download`;

export const SPECS: readonly SpecConfig[] = [
    { id: 'accounting', url: SPEC_URL('accounting') },
    { id: 'budgets', url: SPEC_URL('budgets') },
    { id: 'expenses', url: SPEC_URL('expenses') },
    { id: 'fields', url: SPEC_URL('fields') },
    { id: 'onboarding', url: SPEC_URL('onboarding') },
    { id: 'payments', url: SPEC_URL('payments') },
    { id: 'team', url: SPEC_URL('team') },
    { id: 'transactions', url: SPEC_URL('transactions') },
    { id: 'travel', url: SPEC_URL('travel') },
    { id: 'webhooks', url: SPEC_URL('webhooks') },
];

export const SPECS_DIR = new URL('../specs/', import.meta.url).pathname;
export const SRC_DIR = new URL('../src/', import.meta.url).pathname;
