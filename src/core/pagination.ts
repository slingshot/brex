/** The cursor envelope shared by every paginated Brex endpoint. */
export interface PageShape {
    next_cursor?: string | null;
    items?: readonly unknown[];
}

export type PageItem<P extends PageShape> = NonNullable<P['items']>[number];

/**
 * Return type of every paginated SDK method — both a promise and an iterator:
 *
 * - `await client.vendors.list()` → the first page;
 * - `for await (const vendor of client.vendors.list())` → every item, across
 *   pages, following `next_cursor` automatically;
 * - `for await (const page of client.vendors.list().pages())` → page-by-page.
 *
 * Each `await`/iteration starts its own request(s).
 */
export class PagePromise<P extends PageShape>
    implements PromiseLike<P>, AsyncIterable<PageItem<P>>
{
    readonly #fetchPage: (cursor?: string) => Promise<P>;

    constructor(fetchPage: (cursor?: string) => Promise<P>) {
        this.#fetchPage = fetchPage;
    }

    // biome-ignore lint/suspicious/noThenProperty: PagePromise deliberately implements PromiseLike
    then<TResult1 = P, TResult2 = never>(
        onfulfilled?: ((value: P) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
        return this.#fetchPage(undefined).then(onfulfilled, onrejected);
    }

    /** Iterate page-by-page, following `next_cursor` until exhausted. */
    async *pages(): AsyncGenerator<P, void, undefined> {
        let cursor: string | undefined;
        do {
            const page = await this.#fetchPage(cursor);
            yield page;
            cursor = page.next_cursor ?? undefined;
        } while (cursor !== undefined);
    }

    /** Iterate every item across all pages. */
    async *[Symbol.asyncIterator](): AsyncGenerator<PageItem<P>, void, undefined> {
        for await (const page of this.pages()) {
            yield* (page.items ?? []) as readonly PageItem<P>[];
        }
    }
}
