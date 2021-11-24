export interface ApiRequestOptions {
    /** The desired endpoint (e.g. 'vendors'); don't include a leading slash. */
    endpoint: string;
    /** The HTTP method for this request. */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    /** Any desired query params as an object (e.g. `{ name: 'Acme' }` will become `?name=Acme`). */
    query?: { [key: string]: any };
    /** Request body. */
    body?: BodyInit;
    /** An idempotency key for the request (by default, a UUID is generated for each request, but you should provide one manually to ensure true idempotency). */
    idempotencyKey?: string;
}
