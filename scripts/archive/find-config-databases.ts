import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const CONFIG_PAGE_ID = "1feaf5dbbe15805dbdf5efd47ff793e7";

const notion = new Client({ auth: TOKEN });

async function findDatabasesInPage() {
    console.log("🔍 ANALYZING CONFIG PAGE...\n");

    // Get the page itself
    const page = await notion.pages.retrieve({ page_id: CONFIG_PAGE_ID }) as any;
    console.log(`📄 Page: ${page.icon?.emoji || ""} ${(page.properties.title?.title?.[0]?.plain_text || "Config")}`);

    // Get all blocks in the page
    const blocks = await notion.blocks.children.list({
        block_id: CONFIG_PAGE_ID,
        page_size: 100
    });

    console.log(`\n📦 Found ${blocks.results.length} blocks\n`);

    const databases: any[] = [];
    const childPages: any[] = [];

    for (const block of blocks.results) {
        const b = block as any;

        if (b.type === 'child_database') {
            databases.push({
                id: b.id,
                title: b.child_database?.title || "Untitled DB"
            });
            console.log(`🗄️  Database: ${b.child_database?.title || "Untitled"}`);
            console.log(`   ID: ${b.id}`);
        } else if (b.type === 'child_page') {
            childPages.push({
                id: b.id,
                title: b.child_page?.title || "Untitled Page"
            });
            console.log(`📄 Page: ${b.child_page?.title || "Untitled"}`);
        }
    }

    // Save results
    const output = {
        configPage: {
            id: CONFIG_PAGE_ID,
            title: page.properties.title?.title?.[0]?.plain_text || "Config"
        },
        databases,
        childPages
    };

    writeFileSync('config-page-structure.json', JSON.stringify(output, null, 2));
    console.log("\n✅ Structure saved to config-page-structure.json");

    // Now analyze each database found
    if (databases.length > 0) {
        console.log("\n\n🔍 ANALYZING DATABASES...\n");

        for (const db of databases) {
            console.log(`\n${"=".repeat(60)}`);
            console.log(`📊 ${db.title}`);
            console.log(`${"=".repeat(60)}`);

            try {
                const dbInfo = await notion.databases.retrieve({ database_id: db.id });
                const pages = await notion.databases.query({
                    database_id: db.id,
                    page_size: 100
                });

                console.log(`   Properties: ${Object.keys((dbInfo as any).properties).join(', ')}`);
                console.log(`   Pages: ${pages.results.length}`);

                // Show first few pages
                console.log(`\n   Sample pages:`);
                for (const page of pages.results.slice(0, 5)) {
                    const p = page as any;
                    const props = p.properties;
                    let title = "Untitled";

                    for (const [key, value] of Object.entries(props)) {
                        const prop = value as any;
                        if (prop.type === 'title' && prop.title?.length > 0) {
                            title = prop.title[0].plain_text;
                            break;
                        }
                    }

                    console.log(`      ${p.icon?.emoji || "📄"} ${title}`);
                }

                if (pages.results.length > 5) {
                    console.log(`      ... and ${pages.results.length - 5} more`);
                }

            } catch (error: any) {
                console.error(`   ❌ Error: ${error.message}`);
            }
        }
    }

    return { databases, childPages };
}

findDatabasesInPage().catch(console.error);

