import { fail, GEN_HEADER } from './common';
import type { NamedOperation } from './naming';

export function pascal(name: string): string {
    return (name[0]?.toUpperCase() ?? '') + name.slice(1);
}

/** `user_id` → `userId` (generated method parameter names). */
function camelize(name: string): string {
    return name.replace(/[_-]([a-z0-9])/gi, (_, c: string) => c.toUpperCase());
}

export interface NamespaceModel {
    namespace: string;
    className: string;
    ops: NamedOperation[];
}

export interface SpecModel {
    specId: string;
    clientClassName: string;
    namespaces: NamespaceModel[];
}

/** Groups a spec's named operations into deterministic, sorted class models. */
export function buildSpecModel(specId: string, named: NamedOperation[]): SpecModel {
    const byNamespace = new Map<string, NamedOperation[]>();
    for (const op of named) {
        if (op.specId !== specId) continue;
        const list = byNamespace.get(op.namespace) ?? [];
        list.push(op);
        byNamespace.set(op.namespace, list);
    }
    const namespaces = [...byNamespace.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([namespace, ops]) => ({
            namespace,
            className: pascal(namespace),
            ops: ops.slice().sort((a, b) => a.methodName.localeCompare(b.methodName)),
        }));
    return { specId, clientClassName: `Brex${pascal(specId)}`, namespaces };
}

function jsdoc(op: NamedOperation): string {
    const lines: string[] = [];
    if (op.summary) lines.push(op.summary);
    const scopes = op.scopes.length
        ? ` — requires OAuth scope: ${op.scopes.map((s) => `\`${s}\``).join(', ')}`
        : '';
    lines.push(`\`${op.method.toUpperCase()} ${op.path}\`${scopes}`);
    if (op.paginated) {
        lines.push('Await for a single page, or `for await` to iterate items across all pages.');
    }
    if (op.idempotency === 'required') {
        lines.push(
            'Sends an `Idempotency-Key` header: `options.idempotencyKey`, or an auto-generated UUID.',
        );
    } else if (op.idempotency === 'optional') {
        lines.push('Supports an optional `Idempotency-Key` via `options.idempotencyKey`.');
    }
    if (op.deprecated) lines.push('@deprecated Marked deprecated in the Brex OpenAPI spec.');
    return ['/**', ...lines.map((l) => ` * ${l}`), ' */'].join('\n  ');
}

function emitMethod(op: NamedOperation): string {
    const typePrefix = `paths["${op.path}"]["${op.method}"]`;
    const responseType = `${typePrefix}["responses"]["${op.successStatus}"]["content"]["application/json"]`;

    const args: string[] = [];
    for (const param of op.pathParams) {
        args.push(`${camelize(param)}: ${typePrefix}["parameters"]["path"]["${param}"]`);
    }
    if (op.hasBody) {
        args.push(
            `body${op.bodyRequired ? '' : '?'}: NonNullable<${typePrefix}["requestBody"]>["content"]["application/json"]`,
        );
    }
    if (op.queryParamNames.length > 0) {
        args.push(`query${op.queryHasRequired ? '' : '?'}: ${typePrefix}["parameters"]["query"]`);
    }
    args.push('options?: RequestOptions');

    const pathExpression =
        op.pathParams.length === 0
            ? `"${op.path}"`
            : `\`${op.path.replace(/\{([^}]+)\}/g, (_, name: string) => `\${encodeURIComponent(${camelize(name)})}`)}\``;

    const requestArgs: string[] = [];
    if (op.hasBody) requestArgs.push('body');
    if (op.queryParamNames.length > 0) requestArgs.push('query');
    if (op.idempotency !== 'none') requestArgs.push(`idempotency: "${op.idempotency}"`);
    requestArgs.push('options');
    const argsObject = `{ ${requestArgs.join(', ')} }`;

    let returnType: string;
    let body: string;
    if (op.paginated) {
        if (op.method !== 'get')
            fail(`${op.specId}.${op.operationId}: paginated non-GET unsupported`);
        returnType = `PagePromise<${responseType}>`;
        body = `return this._core.list<${responseType}>(${pathExpression}, ${argsObject});`;
    } else if (op.successHasJson) {
        returnType = `Promise<${responseType}>`;
        body = `return this._core.request<${responseType}>("${op.method.toUpperCase()}", ${pathExpression}, ${argsObject});`;
    } else {
        returnType = 'Promise<void>';
        body = `return this._core.request<void>("${op.method.toUpperCase()}", ${pathExpression}, ${argsObject});`;
    }

    return [
        `  ${jsdoc(op)}`,
        `  ${op.methodName}(${args.join(', ')}): ${returnType} {`,
        `    ${body}`,
        '  }',
    ].join('\n');
}

/** Emits `src/<spec>/client.gen.ts`: one class per namespace + the spec client. */
export function emitClient(model: SpecModel): string {
    const parts: string[] = [
        GEN_HEADER,
        'import type { BrexCore } from "../core/client";',
        'import type { RequestOptions } from "../core/options";',
        'import type { PagePromise } from "../core/pagination";',
        'import type { paths } from "./types.gen";',
        '',
    ];

    for (const ns of model.namespaces) {
        parts.push(`export class ${ns.className} {`);
        parts.push('  constructor(private readonly _core: BrexCore) {}');
        parts.push('');
        parts.push(ns.ops.map(emitMethod).join('\n\n'));
        parts.push('}');
        parts.push('');
    }

    parts.push(`export class ${model.clientClassName} {`);
    for (const ns of model.namespaces) {
        parts.push(`  readonly ${ns.namespace}: ${ns.className};`);
    }
    parts.push('  constructor(core: BrexCore) {');
    for (const ns of model.namespaces) {
        parts.push(`    this.${ns.namespace} = new ${ns.className}(core);`);
    }
    parts.push('  }');
    parts.push('}');
    parts.push('');

    return parts.join('\n');
}
