/**
 * Deterministic SDK generation: a pure function of `specs/*.yaml`,
 * `scripts/generate/overrides.ts`, and the exactly-pinned toolchain.
 * Run twice → byte-identical output (CI enforces this).
 */
import { join } from 'node:path';
import { parse } from 'yaml';
import { GenerationError } from './generate/common';
import { buildSpecModel, emitClient, type SpecModel } from './generate/emit-client';
import { emitRootEntry, emitSpecEntry } from './generate/emit-entries';
import { updateReadme } from './generate/emit-readme';
import { emitSchemas } from './generate/emit-schemas';
import { emitTypes } from './generate/emit-types';
import type { OperationIR, SpecDocument } from './generate/ir';
import { extractOperations } from './generate/ir';
import { assignNames } from './generate/naming';
import { overrides } from './generate/overrides';
import { SPECS, SPECS_DIR, SRC_DIR } from './specs.config';

try {
    const docs = new Map<string, SpecDocument>();
    const allOps: OperationIR[] = [];
    for (const spec of SPECS) {
        const doc = parse(
            await Bun.file(join(SPECS_DIR, `${spec.id}.yaml`)).text(),
        ) as SpecDocument;
        docs.set(spec.id, doc);
        allOps.push(...extractOperations(spec.id, doc));
    }

    // Naming and uniqueness are global (the root Brex class flattens namespaces).
    const named = assignNames(allOps, overrides);

    const models: SpecModel[] = [];
    for (const spec of SPECS) {
        const doc = docs.get(spec.id) as SpecDocument;
        const model = buildSpecModel(spec.id, named);
        models.push(model);

        const outDir = join(SRC_DIR, spec.id);
        await Bun.write(join(outDir, 'types.gen.ts'), await emitTypes(doc));
        await Bun.write(join(outDir, 'schemas.gen.ts'), emitSchemas(spec.id, doc));
        await Bun.write(join(outDir, 'client.gen.ts'), emitClient(model));
        await Bun.write(join(outDir, 'index.ts'), emitSpecEntry(model));
    }
    await Bun.write(join(SRC_DIR, 'index.ts'), emitRootEntry(models));

    const readmePath = new URL('../README.md', import.meta.url).pathname;
    await Bun.write(readmePath, updateReadme(await Bun.file(readmePath).text(), models));

    // Formatting is part of generation so output is stable regardless of emitter style.
    const format = Bun.spawnSync(['bunx', 'biome', 'check', '--write', 'src/'], {
        stdout: 'inherit',
        stderr: 'inherit',
    });
    if (format.exitCode !== 0) process.exit(format.exitCode);

    console.log('\nGenerated:');
    for (const model of models) {
        const count = model.namespaces.reduce((n, ns) => n + ns.ops.length, 0);
        const namespaces = model.namespaces.map((ns) => ns.namespace).join(', ');
        console.log(
            `  ${model.specId.padEnd(14)} ${String(count).padStart(3)} ops  (${namespaces})`,
        );
    }
    console.log(`  ${'total'.padEnd(14)} ${String(named.length).padStart(3)} ops`);
} catch (error) {
    if (error instanceof GenerationError) {
        console.error(`\n✗ generation failed: ${error.message}\n`);
        process.exit(1);
    }
    throw error;
}
