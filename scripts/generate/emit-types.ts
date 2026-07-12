import openapiTS, { astToString } from 'openapi-typescript';
import { GEN_HEADER } from './common';
import type { SpecDocument } from './ir';
import { breakPolymorphismCycles } from './transform';

/**
 * Step 1 of generation: OpenAPI schema → TypeScript `paths` + `components`
 * interfaces, via openapi-typescript (pinned exact version; `alphabetize`
 * makes output independent of upstream key order).
 */
export async function emitTypes(doc: SpecDocument): Promise<string> {
    const transformed = breakPolymorphismCycles(structuredClone(doc));
    const ast = await openapiTS(transformed as Parameters<typeof openapiTS>[0], {
        alphabetize: true,
    });
    return GEN_HEADER + astToString(ast);
}
