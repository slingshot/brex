import { fail, GEN_HEADER } from './common';
import type { SpecDocument } from './ir';

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** `CustomField.ValueWrapper` → `CustomField_ValueWrapper` (deterministic). */
function aliasName(name: string): string {
    const sanitized = name.replace(/[^A-Za-z0-9_$]/g, '_');
    return IDENTIFIER.test(sanitized) ? sanitized : `_${sanitized}`;
}

/**
 * Step 2 of generation: named type aliases for every component schema, so
 * users can `import type { VendorResponse } from "brex/payments"` instead of
 * indexing into `components["schemas"]`.
 */
export function emitSchemas(specId: string, doc: SpecDocument): string {
    const names = Object.keys(doc.components?.schemas ?? {}).sort();
    const lines = [GEN_HEADER, 'import type { components } from "./types.gen";', ''];
    const seen = new Map<string, string>();
    for (const name of names) {
        const alias = aliasName(name);
        const conflict = seen.get(alias);
        if (conflict) {
            fail(
                `spec "${specId}" schemas "${conflict}" and "${name}" both sanitize to alias "${alias}"`,
            );
        }
        seen.set(alias, name);
        lines.push(`export type ${alias} = components["schemas"]["${name}"];`);
    }
    lines.push('');
    return lines.join('\n');
}
