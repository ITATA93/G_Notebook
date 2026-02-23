import { Client } from "@notionhq/client";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

async function listRootPages() {
    console.log("🔍 BUSCANDO PÁGINAS DISPONIBLES\n");

    const response = await notion.search({
        filter: { property: 'object', value: 'page' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 20
    });

    for (const page of response.results) {
        const p = page as any;
        const title = p.properties?.title?.title?.[0]?.plain_text || "Untitled";
        console.log(`📄 ${title} (ID: ${p.id})`);

        // Check if this is the root page we want
        if (title.includes("Core") && title.includes("Notion")) {
            console.log("✅ ENCONTRADO!");
        }
    }
}

listRootPages().catch(console.error);

