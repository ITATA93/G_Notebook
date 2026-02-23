import { describe, it, expect } from "vitest";
import { retryWithBackoff, sleep } from "../src/utils/helpers.js";

describe("helpers", () => {
    it("sleep waits roughly the requested time", async () => {
        const start = Date.now();
        await sleep(50);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it("retryWithBackoff retries until success", async () => {
        let attempts = 0;
        const result = await retryWithBackoff(async () => {
            attempts += 1;
            if (attempts < 2) {
                throw new Error("fail");
            }
            return "ok";
        }, 3, 1);
        expect(result).toBe("ok");
        expect(attempts).toBe(2);
    });
});
