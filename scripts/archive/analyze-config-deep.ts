import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

interface PageContent {
    id: string;
    title: string;
    icon?: string;
    hasBlocks: boolean;
    blockCount: number;
    blockTypes: string[];
    childPages: PageContent[];
    properties: Record<string, any>;
}

async function analyzePageRecursive(pageId: string, depth: number = 0): Promise<PageContent> {
    const indent = "  ".repeat(depth);

    // Get page info
    const page = await notion.pages.retrieve({ page_id: pageId }) as any;

    let title = "Untitled";
    const props = page.properties;
    for (const [key, value] of Object.entries(props)) {
        const prop = value as any;
        if (prop.type === 'title' && prop.title?.length > 0) {
            title = prop.title[0].plain_text;
            break;
        }
    }

    console.log(`${indent}${page.icon?.emoji || "📄"} ${title}`);

    // Get blocks
    const blocks = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100
    });

    const blockTypes = new Set<string>();
    const childPageIds: string[] = [];

    for (const block of blocks.results) {
        const b = block as any;
        blockTypes.add(b.type);

        if (b.type === 'child_page') {
            childPageIds.push(b.id);
        }
    }

    if (blocks.results.length > 0) {
        console.log(`${indent}   📝 ${blocks.results.length} blocks: ${Array.from(blockTypes).join(', ')}`);
    }

    // Recursively analyze child pages
    const childPages: PageContent[] = [];
    for (const childId of childPageIds) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const childContent = await analyzePageRecursive(childId, depth + 1);
        childPages.push(childContent);
    }

    return {
        id: pageId,
        title,
        icon: page.icon?.emoji,
        hasBlocks: blocks.results.length > 0,
        blockCount: blocks.results.length,
        blockTypes: Array.from(blockTypes),
        childPages,
        properties: props
    };
}

async function analyzeConfigStructure() {
    console.log("🔍 DEEP ANALYSIS OF CONFIG PAGE STRUCTURE\n");
    console.log("=".repeat(70) + "\n");

    const CONFIG_PAGE_ID = "1feaf5dbbe15805dbdf5efd47ff793e7";

    const structure = await analyzePageRecursive(CONFIG_PAGE_ID);

    // Save detailed structure
    writeFileSync('config-full-structure.json', JSON.stringify(structure, null, 2));
    console.log("\n✅ Full structure saved to config-full-structure.json");

    // Generate migration plan
    console.log("\n\n📋 MIGRATION PLAN");
    console.log("=".repeat(70));

    console.log("\n🎯 STRATEGY:");
    console.log("1. Preserve all page content (blocks) during migration");
    console.log("2. Map pages to appropriate new databases based on:");
    console.log("   - Page title/name");
    console.log("   - Existing properties");
    console.log("   - Content type");
    console.log("3. Maintain parent-child relationships");
    console.log("4. Create backup before any deletion");

    console.log("\n📊 DISCOVERED STRUCTURE:");
    printStructureSummary(structure, 0);

    console.log("\n\n⚠️  CRITICAL: NO DATA WILL BE DELETED");
    console.log("Next steps:");
    console.log("1. Review config-full-structure.json");
    console.log("2. Approve migration mapping");
    console.log("3. Execute migration (copy, not move)");
    console.log("4. Verify all data in new system");
    console.log("5. Only then consider archiving old structure");
}

function printStructureSummary(page: PageContent, depth: number) {
    const indent = "  ".repeat(depth);
    const contentInfo = page.hasBlocks ? `📝 ${page.blockCount} blocks` : "⚪ Empty";
    const childInfo = page.childPages.length > 0 ? `👶 ${page.childPages.length} children` : "";

    console.log(`${indent}${page.icon || "📄"} ${page.title}`);
    console.log(`${indent}   ${contentInfo} ${childInfo}`);

    if (page.blockTypes.length > 0) {
        console.log(`${indent}   Types: ${page.blockTypes.join(', ')}`);
    }

    for (const child of page.childPages) {
        printStructureSummary(child, depth + 1);
    }
}

analyzeConfigStructure().catch(console.error);

