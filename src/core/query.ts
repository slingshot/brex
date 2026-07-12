/**
 * Serializes query params the way the Brex API expects (`form` + `explode`):
 * arrays repeat their key verbatim per element — bracket-style names like
 * `expand[]` are part of the parameter name, never synthesized.
 */
export function serializeQuery(query: Record<string, unknown> | undefined): string {
    if (!query) return '';
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item === undefined || item === null) continue;
                params.append(key, String(item));
            }
        } else {
            params.append(key, String(value));
        }
    }
    const serialized = params.toString();
    return serialized ? `?${serialized}` : '';
}
