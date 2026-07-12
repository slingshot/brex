import { describe, expect, test } from 'bun:test';
import { parse } from 'yaml';
import { buildSpecModel, emitClient } from '../scripts/generate/emit-client';
import { emitRootEntry, emitSpecEntry } from '../scripts/generate/emit-entries';
import { emitSchemas } from '../scripts/generate/emit-schemas';
import { emitTypes } from '../scripts/generate/emit-types';
import type { SpecDocument } from '../scripts/generate/ir';
import { extractOperations } from '../scripts/generate/ir';
import { assignNames } from '../scripts/generate/naming';
import type { Overrides } from '../scripts/generate/overrides';

const FIXTURE_OVERRIDES: Overrides = {
    tags: { 'mini.Gadget Ops': { namespace: 'archive' } },
    operations: { 'mini.listWidgets_1': 'listArchived' },
};

async function loadFixture(): Promise<SpecDocument> {
    const path = new URL('./fixtures/mini.yaml', import.meta.url).pathname;
    return parse(await Bun.file(path).text()) as SpecDocument;
}

describe('generator output for the mini fixture spec', () => {
    test('IR extraction finds every operation with the right shape', async () => {
        const ops = extractOperations('mini', await loadFixture());

        expect(ops.map((op) => op.operationId).sort()).toEqual([
            'createWidget',
            'deleteWidget',
            'getWidgetById',
            'listWidgets',
            'listWidgets_1',
            'updateWidget',
        ]);
        const byId = new Map(ops.map((op) => [op.operationId, op]));
        expect(byId.get('listWidgets')?.paginated).toBe(true);
        expect(byId.get('listWidgets_1')?.paginated).toBe(false);
        expect(byId.get('createWidget')?.idempotency).toBe('required');
        expect(byId.get('updateWidget')?.idempotency).toBe('optional');
        expect(byId.get('updateWidget')?.bodyRequired).toBe(false);
        expect(byId.get('deleteWidget')?.successHasJson).toBe(false);
    });

    test('client.gen.ts snapshot', async () => {
        const ops = extractOperations('mini', await loadFixture());
        const named = assignNames(ops, FIXTURE_OVERRIDES);
        expect(emitClient(buildSpecModel('mini', named))).toMatchSnapshot();
    });

    test('index.ts (subpath entry) snapshot', async () => {
        const ops = extractOperations('mini', await loadFixture());
        const named = assignNames(ops, FIXTURE_OVERRIDES);
        expect(emitSpecEntry(buildSpecModel('mini', named))).toMatchSnapshot();
    });

    test('root index.ts snapshot', async () => {
        const ops = extractOperations('mini', await loadFixture());
        const named = assignNames(ops, FIXTURE_OVERRIDES);
        expect(emitRootEntry([buildSpecModel('mini', named)])).toMatchSnapshot();
    });

    test('schemas.gen.ts snapshot', async () => {
        expect(emitSchemas('mini', await loadFixture())).toMatchSnapshot();
    });

    test('types.gen.ts snapshot (pins openapi-typescript output)', async () => {
        expect(await emitTypes(await loadFixture())).toMatchSnapshot();
    });
});
