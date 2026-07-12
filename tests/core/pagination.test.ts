import { describe, expect, test } from "bun:test";
import { BrexCore } from "../../src/core/client";
import { PagePromise } from "../../src/core/pagination";
import { fetchMock, jsonResponse } from "../helpers";

interface Page {
  next_cursor?: string | null;
  items?: Array<{ id: string }>;
}

describe("PagePromise", () => {
  test("awaiting yields the first page only", async () => {
    let fetches = 0;
    const page = new PagePromise<Page>(async () => {
      fetches++;
      return { next_cursor: "more", items: [{ id: "a" }] };
    });

    const first = await page;

    expect(first.items).toEqual([{ id: "a" }]);
    expect(fetches).toBe(1);
  });

  test("for-await iterates items across pages until next_cursor is null", async () => {
    const pages: Page[] = [
      { next_cursor: "c2", items: [{ id: "a" }, { id: "b" }] },
      { next_cursor: "c3", items: [{ id: "c" }] },
      { next_cursor: null, items: [{ id: "d" }] },
    ];
    const cursors: Array<string | undefined> = [];
    const promise = new PagePromise<Page>(async (cursor) => {
      cursors.push(cursor);
      return pages[cursors.length - 1] as Page;
    });

    const ids: string[] = [];
    for await (const item of promise) ids.push(item.id);

    expect(ids).toEqual(["a", "b", "c", "d"]);
    expect(cursors).toEqual([undefined, "c2", "c3"]);
  });

  test("handles pages with missing items array", async () => {
    const promise = new PagePromise<Page>(async () => ({ next_cursor: null }));
    const ids: string[] = [];
    for await (const item of promise) ids.push(item.id);
    expect(ids).toEqual([]);
  });

  test(".pages() iterates page-by-page", async () => {
    const data: Page[] = [
      { next_cursor: "c2", items: [{ id: "a" }] },
      { next_cursor: null, items: [{ id: "b" }] },
    ];
    let i = 0;
    const promise = new PagePromise<Page>(async () => data[i++] as Page);

    const sizes: number[] = [];
    for await (const page of promise.pages()) sizes.push(page.items?.length ?? 0);

    expect(sizes).toEqual([1, 1]);
  });
});

describe("BrexCore.list", () => {
  test("merges the pagination cursor into the query, overriding a user-passed cursor", async () => {
    const { fetch, calls } = fetchMock(
      () => jsonResponse({ next_cursor: "c2", items: [{ id: "a" }] }),
      () => jsonResponse({ next_cursor: null, items: [{ id: "b" }] }),
    );
    const core = new BrexCore({ token: "t", fetch });

    const ids: string[] = [];
    for await (const item of core.list<{ next_cursor?: string | null; items?: { id: string }[] }>(
      "/v1/vendors",
      { query: { limit: 1, cursor: "user-cursor" } },
    )) {
      ids.push(item.id);
    }

    expect(ids).toEqual(["a", "b"]);
    // First request keeps the user's cursor; follow-ups use the server's next_cursor.
    expect(calls[0]?.url).toBe("https://api.brex.com/v1/vendors?limit=1&cursor=user-cursor");
    expect(calls[1]?.url).toBe("https://api.brex.com/v1/vendors?limit=1&cursor=c2");
  });
});
