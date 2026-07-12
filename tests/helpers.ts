/** Test doubles for the injectable fetch. */

export interface RecordedCall {
  url: string;
  init: RequestInit;
  headers: Headers;
  body: string | undefined;
}

export function fetchMock(
  ...handlers: Array<(url: string, init: RequestInit) => Response | Promise<Response>>
): { fetch: typeof globalThis.fetch; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const request = init ?? {};
    calls.push({
      url,
      init: request,
      headers: new Headers(request.headers),
      body: typeof request.body === "string" ? request.body : undefined,
    });
    const handler = handlers[Math.min(calls.length - 1, handlers.length - 1)];
    if (!handler) throw new Error(`fetchMock: no handler for call #${calls.length}`);
    return handler(url, request);
  }) as typeof globalThis.fetch;
  return { fetch, calls };
}

export const jsonResponse = (
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

export const emptyResponse = (status = 200): Response => new Response(null, { status });
