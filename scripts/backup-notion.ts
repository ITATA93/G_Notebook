import { Client } from "@notionhq/client";
import { config } from "dotenv";
import { mkdirSync, writeFileSync, copyFileSync } from "fs";
import { join } from "path";
import { DB_IDS, MANIFEST_PATH } from "../src/config.js";
import { notionRateLimiter, retryWithBackoff } from "../src/utils/helpers.js";

config();

const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) {
    throw new Error("NOTION_TOKEN env var is required for backups");
}

const notion = new Client({ auth: TOKEN });
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const baseDir = join("reports", "backups", timestamp);

function ensureDir(): void {
    mkdirSync(baseDir, { recursive: true });
}

async function fetchAllPages(database_id: string): Promise<any[]> {
    let hasMore = true;
    let cursor: string | undefined;
    const pages: any[] = [];

    while (hasMore) {
        await notionRateLimiter.waitIfNeeded();
        const response = await retryWithBackoff(() =>
            notion.databases.query({
                database_id,
                start_cursor: cursor,
                page_size: 100
            })
        );
        pages.push(...response.results);
        hasMore = response.has_more;
        cursor = response.next_cursor as string | undefined;
    }

    return pages;
}

async function backup(): Promise<void> {
    ensureDir();
    copyFileSync(MANIFEST_PATH, join(baseDir, "nos.yaml"));
    writeFileSync(join(baseDir, "config-db-ids.json"), JSON.stringify(DB_IDS, null, 2));

    for (const [dbKey, dbId] of Object.entries(DB_IDS)) {
        console.log(`📦 Backing up ${dbKey}...`);
        const pages = await fetchAllPages(dbId);
        writeFileSync(join(baseDir, `${dbKey}.json`), JSON.stringify({ databaseId: dbId, pages }, null, 2));
    }

    console.log(`Backup listo en ${baseDir}`);
}

backup().catch((err) => {
    console.error("Backup failed:", err);
    process.exit(1);
});
