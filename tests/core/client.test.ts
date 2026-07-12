import { describe, expect, test } from "bun:test";
import { BrexCore } from "../../src/core/client";
import { BrexError } from "../../src/core/error";
import { emptyResponse, fetchMock, jsonResponse } from "../helpers";

describe("BrexCore.request", () => {
  test("sends bearer auth, accept header, and hits the production base URL", async () => {
    const { fetch, calls } = fetchMock(() => jsonResponse({ id: "u1" }));
    const core = new BrexCore({ token: "tok_123", fetch });

    const result = await core.request<{ id: string }>("GET", "/v2/users/me");

    expect(result).toEqual({ id: "u1" });
    expect(calls[0]?.url).toBe("https://api.brex.com/v2/users/me");
    expect(calls[0]?.init.method).toBe("GET");
    expect(calls[0]?.headers.get("authorization")).toBe("Bearer tok_123");
    expect(calls[0]?.headers.get("accept")).toBe("application/json");
    expect(calls[0]?.headers.get("content-type")).toBeNull();
    expect(calls[0]?.body).toBeUndefined();
  });

  test("resolves an async token provider per request", async () => {
    const { fetch, calls } = fetchMock(
      () => jsonResponse({}),
      () => jsonResponse({}),
    );
    let n = 0;
    const core = new BrexCore({ token: async () => `tok_${++n}`, fetch });

    await core.request("GET", "/v2/users/me");
    await core.request("GET", "/v2/users/me");

    expect(calls[0]?.headers.get("authorization")).toBe("Bearer tok_1");
    expect(calls[1]?.headers.get("authorization")).toBe("Bearer tok_2");
  });

  test('baseUrl "staging" and custom base URLs (trailing slash stripped)', async () => {
    const a = fetchMock(() => jsonResponse({}));
    await new BrexCore({ token: "t", baseUrl: "staging", fetch: a.fetch }).request("GET", "/v1/x");
    expect(a.calls[0]?.url).toBe("https://api-staging.brex.com/v1/x");

    const b = fetchMock(() => jsonResponse({}));
    await new BrexCore({ token: "t", baseUrl: "http://localhost:8080/", fetch: b.fetch }).request(
      "GET",
      "/v1/x",
    );
    expect(b.calls[0]?.url).toBe("http://localhost:8080/v1/x");
  });

  test("serializes JSON bodies with content-type", async () => {
    const { fetch, calls } = fetchMock(() => jsonResponse({ id: "v1" }));
    const core = new BrexCore({ token: "t", fetch });

    await core.request("POST", "/v1/vendors", { body: { name: "Acme" } });

    expect(calls[0]?.init.method).toBe("POST");
    expect(calls[0]?.headers.get("content-type")).toBe("application/json");
    expect(calls[0]?.body).toBe('{"name":"Acme"}');
  });

  test("appends query string", async () => {
    const { fetch, calls } = fetchMock(() => jsonResponse({}));
    const core = new BrexCore({ token: "t", fetch });

    await core.request("GET", "/v1/vendors", { query: { name: "Acme", limit: 2 } });

    expect(calls[0]?.url).toBe("https://api.brex.com/v1/vendors?name=Acme&limit=2");
  });

  test("auto-generates a UUID Idempotency-Key when required and omitted", async () => {
    const { fetch, calls } = fetchMock(() => jsonResponse({}));
    const core = new BrexCore({ token: "t", fetch });

    await core.request("POST", "/v1/vendors", { body: {}, idempotency: "required" });

    const key = calls[0]?.headers.get("idempotency-key");
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  test("uses the explicit idempotencyKey when provided", async () => {
    const { fetch, calls } = fetchMock(() => jsonResponse({}));
    const core = new BrexCore({ token: "t", fetch });

    await core.request("POST", "/v1/vendors", {
      body: {},
      idempotency: "required",
      options: { idempotencyKey: "my-key" },
    });

    expect(calls[0]?.headers.get("idempotency-key")).toBe("my-key");
  });

  test("sends no Idempotency-Key for optional idempotency when omitted", async () => {
    const { fetch, calls } = fetchMock(() => jsonResponse({}));
    const core = new BrexCore({ token: "t", fetch });

    await core.request("PUT", "/v1/vendors/v1", { body: {}, idempotency: "optional" });

    expect(calls[0]?.headers.get("idempotency-key")).toBeNull();
  });

  test("merges defaultHeaders and per-request headers (per-request wins)", async () => {
    const { fetch, calls } = fetchMock(() => jsonResponse({}));
    const core = new BrexCore({
      token: "t",
      fetch,
      defaultHeaders: { "x-team": "slingshot", "x-shared": "default" },
    });

    await core.request("GET", "/v1/x", { options: { headers: { "x-shared": "override" } } });

    expect(calls[0]?.headers.get("x-team")).toBe("slingshot");
    expect(calls[0]?.headers.get("x-shared")).toBe("override");
  });

  test("returns undefined for empty 200 responses", async () => {
    const { fetch } = fetchMock(() => emptyResponse(200));
    const core = new BrexCore({ token: "t", fetch });

    const result = await core.request<void>("DELETE", "/v1/vendors/v1");

    expect(result).toBeUndefined();
  });

  test("throws BrexError with parsed JSON body and request id", async () => {
    const { fetch } = fetchMock(() =>
      jsonResponse({ message: "Vendor not found" }, 404, { "x-request-id": "req_42" }),
    );
    const core = new BrexCore({ token: "t", fetch });

    const error = await core.request("GET", "/v1/vendors/nope").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BrexError);
    const brexError = error as BrexError;
    expect(brexError.status).toBe(404);
    expect(brexError.body).toEqual({ message: "Vendor not found" });
    expect(brexError.requestId).toBe("req_42");
    expect(brexError.method).toBe("GET");
    expect(brexError.url).toBe("https://api.brex.com/v1/vendors/nope");
    expect(brexError.message).toContain("404");
    expect(brexError.message).toContain("Vendor not found");
  });

  test("throws BrexError with text body for non-JSON errors", async () => {
    const { fetch } = fetchMock(() => new Response("Bad gateway", { status: 502 }));
    const core = new BrexCore({ token: "t", fetch });

    const error = (await core.request("GET", "/v1/x").catch((e: unknown) => e)) as BrexError;

    expect(error).toBeInstanceOf(BrexError);
    expect(error.status).toBe(502);
    expect(error.body).toBe("Bad gateway");
    expect(error.requestId).toBeUndefined();
  });

  test("requires a token", () => {
    expect(() => new BrexCore({ token: "" })).toThrow(/token/);
  });
});
