import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const CONFIG_DB_ID = "1feaf5dbbe15805dbdf5efd47ff793e7";

const notion = new Client({ auth: TOKEN });

interface PageAnalysis {
    id: string;
    title: string;
    icon?: string;
    properties: Record<string, any>;
    hasContent: boolean;
    childPages: number;
    createdTime: string;
    lastEditedTime: string;
}

async function analyzePage(pageId: string): Promise<PageAnalysis> {
    const page = await notion.pages.retrieve({ page_id: pageId }) as any;

    // Get page content to check if it has blocks
    const blocks = await notion.blocks.children.list({ block_id: pageId, page_size: 1 });

    // Get child pages
    const children = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100
    });
    const childPages = children.results.filter((b: any) => b.type === 'child_page').length;

    const props = page.properties;
    let title = "Untitled";

    // Extract title
    for (const [key, value] of Object.entries(props)) {
        const prop = value as any;
        if (prop.type === 'title' && prop.title?.length > 0) {
            title = prop.title[0].plain_text;
            break;
        }
    }

    return {
        id: pageId,
        title,
        icon: page.icon?.emoji,
        properties: props,
        hasContent: blocks.results.length > 0,
        childPages,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time
    };
}

async function analyzeConfigDatabase() {
    console.log("🔍 ANALYZING LEGACY CONFIG DATABASE...\n");

    const response = await notion.databases.query({
        database_id: CONFIG_DB_ID,
        page_size: 100
    });

    console.log(`📊 Found ${response.results.length} pages\n`);

    const analyses: PageAnalysis[] = [];

    for (const page of response.results) {
        if (page.object !== 'page') continue;

        try {
            const analysis = await analyzePage(page.id);
            analyses.push(analysis);

            const contentIndicator = analysis.hasContent ? "📝" : "⚪";
            const childIndicator = analysis.childPages > 0 ? `👶${analysis.childPages}` : "";

            console.log(`${analysis.icon || "📄"} ${analysis.title}`);
            console.log(`   ${contentIndicator} Content | ${childIndicator} | 🕐 ${analysis.lastEditedTime.split('T')[0]}`);

            // Show key properties
            const props = analysis.properties;
            for (const [key, value] of Object.entries(props)) {
                const prop = value as any;
                if (prop.type === 'select' && prop.select) {
                    console.log(`   📌 ${key}: ${prop.select.name}`);
                } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
                    const text = prop.rich_text[0].plain_text;
                    if (text && text.length > 0) {
                        console.log(`   📝 ${key}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
                    }
                } else if (prop.type === 'date' && prop.date) {
                    console.log(`   📅 ${key}: ${prop.date.start}`);
                } else if (prop.type === 'relation' && prop.relation?.length > 0) {
                    console.log(`   🔗 ${key}: ${prop.relation.length} links`);
                }
            }
            console.log("");

            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
            console.error(`   ❌ Error analyzing ${page.id}: ${error.message}`);
        }
    }

    // Save detailed analysis
    const output = {
        totalPages: analyses.length,
        pagesWithContent: analyses.filter(a => a.hasContent).length,
        pagesWithChildren: analyses.filter(a => a.childPages > 0).length,
        pages: analyses
    };

    writeFileSync('config-db-analysis.json', JSON.stringify(output, null, 2));
    console.log("\n✅ Detailed analysis saved to config-db-analysis.json");

    // Generate migration recommendations
    console.log("\n📋 MIGRATION RECOMMENDATIONS:");
    console.log("=".repeat(60));

    const byCategory: Record<string, PageAnalysis[]> = {};
    for (const page of analyses) {
        const catProp = page.properties['Categoría'] || page.properties['Category'];
        const category = catProp?.select?.name || 'Uncategorized';
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(page);
    }

    for (const [category, pages] of Object.entries(byCategory)) {
        console.log(`\n${category} (${pages.length} pages):`);
        for (const page of pages) {
            const target = suggestTargetDatabase(page, category);
            console.log(`   ${page.icon || "📄"} ${page.title} → ${target}`);
        }
    }
}

function suggestTargetDatabase(page: PageAnalysis, category: string): string {
    const title = page.title.toLowerCase();

    // Project indicators
    if (title.includes('magister') || title.includes('diplomado') || title.includes('plan ')) {
        return "DB_PROJECTS 🚀";
    }

    // Subcategory indicators (ongoing areas)
    if (title.includes('seminarios') || title.includes('gastos') || title.includes('salud') ||
        title.includes('urgencias') || title.includes('oncología')) {
        return "DB_SUBCATEGORIES 📂";
    }

    // Entity indicators
    if (title.includes('automóvil') || title.includes('familia') || title.includes('hospital')) {
        return "DB_ENTITIES_ASSETS 🏛️";
    }

    // Default based on category
    if (category.includes('Proyecto')) return "DB_PROJECTS 🚀";
    if (category.includes('Área')) return "DB_SUBCATEGORIES 📂";

    return "DB_SUBCATEGORIES 📂 (default)";
}

analyzeConfigDatabase().catch(console.error);

