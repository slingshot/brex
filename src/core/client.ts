import { BrexError } from "./error";
import type { BrexOptions, RequestOptions } from "./options";
import { PagePromise, type PageShape } from "./pagination";
import { serializeQuery } from "./query";

const BASE_URLS: Record<string, string> = {
  production: "https://api.brex.com",
  staging: "https://api-staging.brex.com",
};

/** Whether the operation's spec declares an Idempotency-Key header, and if it's required. */
export type Idempotency = "required" | "optional" | "none";

export interface RequestArgs {
  body?: unknown;
  query?: Record<string, unknown> | undefined;
  idempotency?: Idempotency;
  options?: RequestOptions | undefined;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * The shared HTTP engine behind every generated resource class. Not part of
 * the typed API surface — use the `Brex` class or a per-API client instead.
 */
export class BrexCore {
  readonly #options: BrexOptions;
  readonly #baseUrl: string;

  constructor(options: BrexOptions) {
    if (!options?.token) {
      throw new Error("brex: `token` is required — pass a string or a token provider function");
    }
    this.#options = options;
    const baseUrl = options.baseUrl ?? "production";
    this.#baseUrl = (BASE_URLS[baseUrl] ?? baseUrl).replace(/\/$/, "");
  }

  async request<T>(method: string, path: string, args: RequestArgs = {}): Promise<T> {
    const { body, query, idempotency = "none", options } = args;

    const token =
      typeof this.#options.token === "function" ? await this.#options.token() : this.#options.token;

    const url = `${this.#baseUrl}${path}${serializeQuery(query)}`;
    const headers = new Headers({
      authorization: `Bearer ${token}`,
      accept: "application/json",
      ...this.#options.defaultHeaders,
      ...options?.headers,
    });
    if (body !== undefined) headers.set("content-type", "application/json");
    const idempotencyKey =
      options?.idempotencyKey ?? (idempotency === "required" ? crypto.randomUUID() : undefined);
    if (idempotencyKey !== undefined) headers.set("idempotency-key", idempotencyKey);

    const fetchImpl = this.#options.fetch ?? globalThis.fetch.bind(globalThis);
    const response = await fetchImpl(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new BrexError({
        status: response.status,
        body: await parseBody(response),
        headers: response.headers,
        method,
        url,
      });
    }
    return (await parseBody(response)) as T;
  }

  list<P extends PageShape>(path: string, args: RequestArgs = {}): PagePromise<P> {
    return new PagePromise<P>((cursor) =>
      this.request<P>("GET", path, {
        ...args,
        query: cursor === undefined ? args.query : { ...args.query, cursor },
      }),
    );
  }
}
