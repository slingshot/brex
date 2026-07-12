import { GEN_HEADER } from './common';
import { pascal, type SpecModel } from './emit-client';

/** Emits `src/<spec>/index.ts` — the `brex/<spec>` subpath entry. */
export function emitSpecEntry(model: SpecModel): string {
    const specPascal = pascal(model.specId);
    const classNames = [
        ...model.namespaces.map((ns) => ns.className),
        model.clientClassName,
    ].sort();
    return [
        GEN_HEADER,
        'import { BrexCore } from "../core/client";',
        'import type { BrexOptions } from "../core/options";',
        `import { ${model.clientClassName} } from "./client.gen";`,
        '',
        `export { ${classNames.join(', ')} } from "./client.gen";`,
        'export type * from "./schemas.gen";',
        `export type { components as ${specPascal}Components, paths as ${specPascal}Paths } from "./types.gen";`,
        'export * from "../core";',
        '',
        `/** Standalone client for the Brex ${specPascal} API. */`,
        `export function create${specPascal}Client(options: BrexOptions): ${model.clientClassName} {`,
        `  return new ${model.clientClassName}(new BrexCore(options));`,
        '}',
        '',
    ].join('\n');
}

/** Emits `src/index.ts` — the root entry with the unified `Brex` class. */
export function emitRootEntry(models: SpecModel[]): string {
    const namespaces = models
        .flatMap((model) => model.namespaces.map((ns) => ({ ...ns, specId: model.specId })))
        .sort((a, b) => a.namespace.localeCompare(b.namespace));

    const importLines = models
        .map((model) => {
            const classes = model.namespaces.map((ns) => ns.className).sort();
            return `import { ${classes.join(', ')} } from "./${model.specId}/client.gen";`;
        })
        .sort();

    return [
        GEN_HEADER,
        'import { BrexCore } from "./core/client";',
        'import type { BrexOptions } from "./core/options";',
        ...importLines,
        '',
        'export * from "./core";',
        '',
        '/**',
        ' * Unified client covering every Brex API.',
        ' *',
        ' * Importing `Brex` pulls in all ten API surfaces; if bundle size matters,',
        ' * import a single API from its subpath instead (e.g. `brex/payments`).',
        ' */',
        'export class Brex {',
        ...namespaces.map((ns) => `  readonly ${ns.namespace}: ${ns.className};`),
        '',
        '  constructor(options: BrexOptions) {',
        '    const core = new BrexCore(options);',
        ...namespaces.map((ns) => `    this.${ns.namespace} = new ${ns.className}(core);`),
        '  }',
        '}',
        '',
    ].join('\n');
}
