/**
 * Utility functions for NOs system
 * Retry logic, rate limiting, and common helpers
 */

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`   ⚠️ Attempt ${attempt + 1} failed: ${lastError.message.slice(0, 50)}... Retrying in ${delay}ms`);
                await sleep(delay);
            } else {
                console.log(`   ❌ All ${maxRetries + 1} attempts failed`);
            }
        }
    }

    throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
    private lastCallTime: number = 0;
    private readonly minInterval: number;

    constructor(maxCallsPerSecond: number = 3) {
        this.minInterval = 1000 / maxCallsPerSecond;
    }

    async waitIfNeeded(): Promise<void> {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;

        if (timeSinceLastCall < this.minInterval) {
            const sleepTime = this.minInterval - timeSinceLastCall;
            await sleep(sleepTime);
        }

        this.lastCallTime = Date.now();
    }
}

// Global rate limiter for Notion API (3 req/s)
export const notionRateLimiter = new RateLimiter(3);

/**
 * Fetch all pages from a Notion database (with pagination)
 */
export async function getAllDatabasePages(
    notion: import("@notionhq/client").Client,
    databaseId: string
): Promise<any[]> {
    const pages: any[] = [];
    let cursor: string | undefined = undefined;

    do {
        await notionRateLimiter.waitIfNeeded();
        const response = await notion.databases.query({
            database_id: databaseId,
            start_cursor: cursor
        });
        pages.push(...response.results);
        cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);

    return pages;
}
