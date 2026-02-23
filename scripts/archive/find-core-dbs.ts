import { Client } from "@notionhq/client";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

async function findCoreNotionDatabases() {
    console.log("🔍 BUSCANDO BASES DE DATOS DE CORE_NOTION\n");

    const response = await notion.search({
        filter: {
            property: 'object',
            value: 'database'
        },
        page_size: 100
    });

    const coreDBs = response.results.filter((db: any) => {
        const title = db.title?.[0]?.plain_text || "";
        return title.includes("Áreas") ||
            title.includes("Proyectos") ||
            title.includes("Subcategorías") ||
            title.includes("Core");
    });

    console.log("Bases de datos encontradas:\n");
    for (const db of coreDBs) {
        const d = db as any;
        console.log(`📊 ${d.title?.[0]?.plain_text || "Untitled"}`);
        console.log(`   ID: ${d.id}`);
        console.log(`   Icon: ${d.icon?.emoji || "none"}\n`);
    }
}

findCoreNotionDatabases().catch(console.error);

