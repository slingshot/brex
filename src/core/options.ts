/** Options for constructing a Brex client. */
export interface BrexOptions {
    /**
     * A Brex API token, or a provider called before every request — useful for
     * OAuth flows where tokens refresh.
     */
    token: string | (() => string | Promise<string>);
    /**
     * `"production"` (default), `"staging"`, or any absolute base URL.
     * Note: staging is not a sandbox; it does not accept customer tokens.
     */
    baseUrl?: 'production' | 'staging' | (string & {});
    /** Injectable fetch for tests, proxies, or custom retry layers. Defaults to global fetch. */
    fetch?: typeof globalThis.fetch;
    /** Headers merged into every request (per-request headers win). */
    defaultHeaders?: Record<string, string>;
}

/** Per-request options accepted by every SDK method. */
export interface RequestOptions {
    /** Extra headers for this request (override defaults). */
    headers?: Record<string, string>;
    /** Abort/timeout control, e.g. `AbortSignal.timeout(10_000)`. */
    signal?: AbortSignal;
    /**
     * Idempotency-Key header value. Where Brex requires one (most creates) and
     * none is given, a random UUID is generated for you — pass your own to make
     * retries of *your* operation idempotent.
     */
    idempotencyKey?: string;
}
