import { fail } from './common';
import type { OperationIR } from './ir';
import type { Overrides } from './overrides';

/** `getVendorById` → `["get", "Vendor", "By", "Id"]` (acronym runs stay whole). */
export function splitCamelWords(identifier: string): string[] {
    return identifier.match(/[A-Z]+(?![a-z])|[A-Z][a-z0-9]*|[a-z0-9]+/g) ?? [];
}

/** `"Spend Limits (v2)"` → `spendLimitsV2`. */
export function namespaceFromTag(tag: string): string {
    const tokens = tag.match(/[A-Za-z0-9]+/g) ?? [];
    const first = tokens[0];
    if (!first) fail(`tag "${tag}" has no alphanumeric characters to derive a namespace from`);
    return [
        first[0]?.toLowerCase() + first.slice(1),
        ...tokens.slice(1).map((t) => (t[0]?.toUpperCase() ?? '') + t.slice(1)),
    ].join('');
}

/** `"Entities"` → `"Entity"`, `"Expenses"` → `"Expense"`, `"Cards"` → `"Card"`. */
function singularize(word: string): string {
    if (word.length > 3 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
    if (word.endsWith('s')) return word.slice(0, -1);
    return word;
}

/**
 * Resource-noun candidates from a tag, as lowercase word runs, longest first:
 * `"Card Expenses"` → `[[card, expenses], [card, expense], [expenses], [expense]]`.
 * Parenthesized version markers (`(v2)`) are namespace-only, never nouns.
 */
export function defaultNounCandidates(tag: string): string[][] {
    const words = (tag.replace(/\([^)]*\)/g, '').match(/[A-Za-z0-9]+/g) ?? []).map((w) =>
        w.toLowerCase(),
    );
    const candidates: string[][] = [];
    for (let start = 0; start < words.length; start++) {
        const suffix = words.slice(start);
        const last = suffix[suffix.length - 1] as string;
        candidates.push(suffix);
        const singular = singularize(last);
        if (singular !== last) candidates.push([...suffix.slice(0, -1), singular]);
    }
    return candidates;
}

/** Candidates from an overrides `resourceNouns` list (each a PascalCase word-join). */
export function overrideNounCandidates(nouns: string[]): string[][] {
    return nouns
        .map((noun) => splitCamelWords(noun).map((w) => w.toLowerCase()))
        .sort((a, b) => b.length - a.length);
}

/**
 * The deterministic method-name algorithm: strip a `_N` dedup suffix, remove
 * the first (longest) resource-noun run, strip a trailing `ById`, re-join.
 * Returns null when the result is empty — the caller demands an override.
 */
export function deriveMethodName(operationId: string, nounCandidates: string[][]): string | null {
    const base = operationId.replace(/_\d+$/, '');
    let words = splitCamelWords(base);
    const lower = () => words.map((w) => w.toLowerCase());

    outer: for (const candidate of nounCandidates) {
        const haystack = lower();
        for (let i = 0; i + candidate.length <= haystack.length; i++) {
            if (candidate.every((word, j) => haystack[i + j] === word)) {
                words = [...words.slice(0, i), ...words.slice(i + candidate.length)];
                break outer;
            }
        }
    }

    const tail = lower();
    if (tail.length >= 2 && tail[tail.length - 2] === 'by' && tail[tail.length - 1] === 'id') {
        words = words.slice(0, -2);
    }

    const first = words[0];
    if (!first) return null;
    return [
        first[0]?.toLowerCase() + first.slice(1),
        ...words.slice(1).map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1)),
    ].join('');
}

export interface NamedOperation extends OperationIR {
    namespace: string;
    methodName: string;
}

/**
 * Applies overrides and the derivation algorithm to every operation, then
 * enforces uniqueness. Fails loudly with the exact override key to add.
 */
export function assignNames(ops: OperationIR[], overrides: Overrides): NamedOperation[] {
    const usedTagKeys = new Set<string>();
    const usedOpKeys = new Set<string>();

    const named = ops.map((op): NamedOperation => {
        const tagKey = `${op.specId}.${op.tag}`;
        const tagOverride = overrides.tags[tagKey];
        if (tagOverride) usedTagKeys.add(tagKey);
        const namespace = tagOverride?.namespace ?? namespaceFromTag(op.tag);

        const opKey = `${op.specId}.${op.operationId}`;
        const opOverride = overrides.operations[opKey];
        let methodName: string;
        if (opOverride !== undefined) {
            usedOpKeys.add(opKey);
            methodName = opOverride;
        } else {
            const candidates = tagOverride?.resourceNouns
                ? overrideNounCandidates(tagOverride.resourceNouns)
                : defaultNounCandidates(op.tag);
            const derived = deriveMethodName(op.operationId, candidates);
            if (!derived) {
                fail(
                    `deriving a method name for ${op.operationId} (tag "${op.tag}") produced an empty ` +
                        `name; add an override: operations["${opKey}"] = "<name>"`,
                );
            }
            methodName = derived;
        }
        return { ...op, namespace, methodName };
    });

    // Uniqueness within each namespace.
    const byQualifiedName = new Map<string, NamedOperation>();
    for (const op of named) {
        const qualified = `${op.namespace}.${op.methodName}`;
        const existing = byQualifiedName.get(qualified);
        if (existing) {
            fail(
                `method name collision on "${qualified}": ${existing.specId}.${existing.operationId} ` +
                    `(${existing.method.toUpperCase()} ${existing.path}) vs ${op.specId}.${op.operationId} ` +
                    `(${op.method.toUpperCase()} ${op.path}); add an override: ` +
                    `operations["${op.specId}.${op.operationId}"] = "<name>"`,
            );
        }
        byQualifiedName.set(qualified, op);
    }

    // A namespace must not span specs (the root Brex class flattens them all).
    const namespaceSpec = new Map<string, string>();
    for (const op of named) {
        const existing = namespaceSpec.get(op.namespace);
        if (existing && existing !== op.specId) {
            fail(
                `namespace "${op.namespace}" is produced by both spec "${existing}" and spec ` +
                    `"${op.specId}"; disambiguate with a tags override`,
            );
        }
        namespaceSpec.set(op.namespace, op.specId);
    }

    // Overrides must stay exact — a stale key means the spec moved underneath us.
    for (const key of Object.keys(overrides.tags)) {
        if (!usedTagKeys.has(key)) fail(`unused tags override "${key}"; remove or fix it`);
    }
    for (const key of Object.keys(overrides.operations)) {
        if (!usedOpKeys.has(key)) fail(`unused operations override "${key}"; remove or fix it`);
    }

    return named;
}
