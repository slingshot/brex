/**
 * Options for initializing an instance of the Brex API.
 */
export interface ApiOptions {
    /**
     * The base URL for this API instance.
     */
    baseURL?: string;

    /**
     * The version of the Brex API to be used; defaults to `v1`.
     */
    apiVersion?: string;

    /**
     * The Brex environment to target. The options are "production" and "staging"
     */
    environment: string;
}
