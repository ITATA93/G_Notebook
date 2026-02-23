import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

async function mapNotion() {
    console.log("🗺️ MAPEANDO ESTRUCTURA ACCESIBLE DE NOTION\n");
    console.log("=".repeat(70));

    let results: any[] = [];
    let hasMore = true;
    let cursor: string | undefined;

    // Get everything
    while (hasMore) {
        const response = await notion.search({
            page_size: 100,
            start_cursor: cursor
        });
        results.push(...response.results);
        hasMore = response.has_more;
        cursor = response.next_cursor || undefined;
    }

    const map: any = {
        databases: [],
        pages: []
    };

    console.log(`\n📚 Total objetos encontrados: ${results.length}`);

    for (const item of results) {
        const id = item.id;
        const type = item.object;
        let title = "Sin Título";
        let parentInfo = "";

        // Get Title
        if (type === "database") {
            title = item.title?.[0]?.plain_text || "Sin Título";
        } else if (type === "page") {
            const props = item.properties;
            // Search for title property
            for (const key in props) {
                if (props[key].type === "title") {
                    title = props[key].title?.[0]?.plain_text || "Sin Título";
                    break;
                }
            }
        }

        // Get Parent
        const parent = item.parent;
        if (parent.type === "page_id") parentInfo = `Padre: Página (${parent.page_id})`;
        else if (parent.type === "database_id") parentInfo = `Padre: BD (${parent.database_id})`;
        else if (parent.type === "workspace") parentInfo = `Raíz del Workspace`;
        else parentInfo = `Padre: ${parent.type}`;

        const entry = {
            id,
            title,
            type,
            parent: parentInfo,
            url: item.url
        };

        if (type === "database") map.databases.push(entry);
        else map.pages.push(entry);
    }

    // Print Report
    console.log("\n📂 BASES DE DATOS ACCESIBLES:");
    console.log("-".repeat(50));
    map.databases.forEach((db: any) => {
        console.log(`[DB] ${db.title}`);
        console.log(`     ID: ${db.id}`);
        console.log(`     ${db.parent}`);
        console.log("");
    });

    console.log("\n📄 PÁGINAS RAÍZ O IMPORTANTES:");
    console.log("-".repeat(50));
    map.pages.forEach((p: any) => {
        // Show only root pages or pages that look like structural pages
        if (p.parent.includes("Raíz") || p.title.includes("Core") || p.title.includes("Config")) {
            console.log(`[PAGE] ${p.title}`);
            console.log(`       ID: ${p.id}`);
            console.log(`       ${p.parent}`);
            console.log("");
        }
    });

    writeFileSync('notion-access-map.json', JSON.stringify(map, null, 2));
    console.log("\n💾 Mapa completo guardado en notion-access-map.json");
}

mapNotion().catch(console.error);

