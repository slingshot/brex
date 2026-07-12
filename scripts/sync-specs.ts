/**
 * Re-downloads the Brex OpenAPI specs into specs/, byte-for-byte as published
 * (no reformatting, so upstream diffs stay reviewable).
 *
 * This script is run by humans, never CI. After running it, review the spec
 * diff, run `bun run generate`, and commit both together.
 */
import { join } from "node:path";
import { SPECS, SPECS_DIR } from "./specs.config";

let changed = 0;
for (const spec of SPECS) {
  const res = await fetch(spec.url);
  if (!res.ok) {
    console.error(`✗ ${spec.id}: HTTP ${res.status} from ${spec.url}`);
    process.exit(1);
  }
  const body = await res.text();
  const path = join(SPECS_DIR, `${spec.id}.yaml`);
  const existing = await Bun.file(path)
    .text()
    .catch(() => null);
  if (existing === body) {
    console.log(`  ${spec.id}: unchanged`);
    continue;
  }
  await Bun.write(path, body);
  console.log(`✓ ${spec.id}: updated (${body.length} bytes)`);
  changed++;
}

console.log(
  changed === 0
    ? "\nAll specs up to date."
    : `\n${changed} spec(s) changed. Review the diff, run \`bun run generate\`, and commit both.`,
);
