/** Error thrown for any non-2xx Brex API response. */
export class BrexError extends Error {
  /** HTTP status code. */
  readonly status: number;
  /** Brex request id (from the `x-request-id` response header), if present. */
  readonly requestId: string | undefined;
  /** Parsed JSON error body when the response was JSON, otherwise the raw text. */
  readonly body: unknown;
  /** Full response headers, as an escape hatch. */
  readonly headers: Headers;
  readonly method: string;
  readonly url: string;

  constructor(args: {
    status: number;
    body: unknown;
    headers: Headers;
    method: string;
    url: string;
  }) {
    const detail =
      typeof args.body === "object" &&
      args.body !== null &&
      "message" in args.body &&
      typeof args.body.message === "string"
        ? `: ${args.body.message}`
        : "";
    super(`Brex API error ${args.status} on ${args.method} ${args.url}${detail}`);
    this.name = "BrexError";
    this.status = args.status;
    this.body = args.body;
    this.headers = args.headers;
    this.method = args.method;
    this.url = args.url;
    this.requestId =
      args.headers.get("x-request-id") ?? args.headers.get("request-id") ?? undefined;
  }
}
