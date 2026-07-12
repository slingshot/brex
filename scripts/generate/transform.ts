import type { SchemaObject, SpecDocument } from "./ir";

/**
 * The Brex specs model polymorphism as `Parent = { props } + oneOf[children]`
 * with each child `allOf`-referencing the parent — circular in both
 * directions, which openapi-typescript emits as self-referential types
 * (TS2502). This rewrites affected schemas into the shape the
 * openapi-typescript docs recommend (https://openapi-ts.dev/advanced):
 *
 * - each child's back-reference to the parent is replaced with an inline copy
 *   of the parent's base properties (what `allOf` inheritance meant), and
 * - the parent becomes a pure `oneOf` union + discriminator (what `oneOf`
 *   meant).
 *
 * Runs on the in-memory document only — vendored specs stay byte-identical to
 * upstream. Purely structural, so it is deterministic.
 */
export function breakPolymorphismCycles(doc: SpecDocument): SpecDocument {
  const schemas = doc.components?.schemas ?? {};

  for (const [parentName, parent] of Object.entries(schemas)) {
    if (!parent.oneOf) continue;
    const selfRef = `#/components/schemas/${parentName}`;

    const base: SchemaObject = { ...parent };
    delete base.oneOf;
    delete (base as Record<string, unknown>).discriminator;
    const baseHasContent = Boolean(base.properties ?? base.allOf);

    let broke = false;
    for (const member of parent.oneOf) {
      const memberName = member.$ref?.replace("#/components/schemas/", "");
      const child = memberName ? schemas[memberName] : undefined;
      if (!child?.allOf) continue;
      const idx = child.allOf.findIndex((entry) => entry.$ref === selfRef);
      if (idx === -1) continue;
      if (baseHasContent) {
        child.allOf[idx] = structuredClone(base);
      } else {
        child.allOf.splice(idx, 1);
      }
      broke = true;
    }

    if (broke) {
      // The base moved into the children; the parent is now a clean union.
      delete parent.properties;
      delete parent.required;
      delete parent.type;
    }
  }

  return doc;
}
