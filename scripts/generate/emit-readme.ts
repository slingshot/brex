import { fail } from './common';
import type { SpecModel } from './emit-client';

const START = '<!-- generated:api-table:start -->';
const END = '<!-- generated:api-table:end -->';

function table(models: SpecModel[]): string {
    const rows = models.flatMap((model) =>
        model.namespaces.map((ns) => {
            const methods = ns.ops
                .map((op) => (op.deprecated ? `~~\`${op.methodName}\`~~` : `\`${op.methodName}\``))
                .join(', ');
            return `| \`brex/${model.specId}\` | \`${ns.namespace}\` | ${methods} |`;
        }),
    );
    return ['| Subpath import | Namespace | Methods |', '| --- | --- | --- |', ...rows.sort()].join(
        '\n',
    );
}

/** Rewrites the generated API table between the README's markers. */
export function updateReadme(readme: string, models: SpecModel[]): string {
    const startIndex = readme.indexOf(START);
    const endIndex = readme.indexOf(END);
    if (startIndex === -1 || endIndex === -1) {
        fail(`README.md is missing the ${START} / ${END} markers`);
    }
    return `${readme.slice(0, startIndex + START.length)}\n\n${table(models)}\n\n${readme.slice(endIndex)}`;
}
