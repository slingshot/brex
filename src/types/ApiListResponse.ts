/**
 * A Brex API response when there are multiple results.
 */
export interface ApiListResponse<T = any> {
    /**
     * The next cursor for paginated results (not provided if no next page).
     */
    nextCursor?: string;
    /**
     * The results on the current page.
     */
    items: T[];
}
