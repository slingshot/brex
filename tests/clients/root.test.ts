import { describe, expect, test } from "bun:test";
import { Brex, BrexError } from "../../src";
import { fetchMock, jsonResponse } from "../helpers";

describe("root Brex client", () => {
  test("exposes every namespace on one shared core", async () => {
    const { fetch, calls } = fetchMock(
      () => jsonResponse({ id: "me" }),
      () => jsonResponse({ next_cursor: null, items: [] }),
    );
    const brex = new Brex({ token: "tok", fetch });

    await brex.users.getMe();
    await brex.transactions.listCash("acct_1");

    expect(calls[0]?.url).toBe("https://api.brex.com/v2/users/me");
    expect(calls[1]?.url).toBe("https://api.brex.com/v2/transactions/cash/acct_1");
    for (const call of calls) {
      expect(call.headers.get("authorization")).toBe("Bearer tok");
    }
  });

  test("re-exports BrexError from the root", async () => {
    const { fetch } = fetchMock(() => jsonResponse({ message: "nope" }, 403));
    const brex = new Brex({ token: "tok", fetch });

    const error = await brex.users.getMe().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BrexError);
    expect((error as BrexError).status).toBe(403);
  });
});
