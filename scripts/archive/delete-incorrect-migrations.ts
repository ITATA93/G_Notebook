import { Client } from "@notionhq/client";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });
const DB_KNOWLEDGE_BASE = "2d7af5db-be15-8130-aa16-ff4dd56adb1c";

async function deleteIncorrectMigrations() {
    console.log("🗑️ ELIMINANDO ITEMS MAL MIGRADOS DE DB_KNOWLEDGE_BASE\n");
    console.log("=".repeat(70));

    // Get all pages
    let allPages: any[] = [];
    let hasMore = true;
    let cursor: string | undefined;

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: DB_KNOWLEDGE_BASE,
            start_cursor: cursor,
            page_size: 100
        });
        allPages.push(...response.results);
        hasMore = response.has_more;
        cursor = response.next_cursor || undefined;
    }

    console.log(`📊 Total de páginas en DB_KNOWLEDGE_BASE: ${allPages.length}\n`);

    // Filter items that only have Tipo = "Libro", "Video", or "Recurso Académico - Pregrado"
    // These are the ones we migrated incorrectly (only basic properties)
    const toDelete = allPages.filter(page => {
        const p = page as any;
        const tipo = p.properties["Tipo"]?.select?.name || "";
        return tipo === "Libro" || tipo === "Video" || tipo.includes("Recurso Académico");
    });

    console.log(`🗑️ Items a eliminar (mal migrados): ${toDelete.length}\n`);

    if (toDelete.length === 0) {
        console.log("✅ No hay items para eliminar");
        return;
    }

    let deleted = 0;

    for (const page of toDelete) {
        try {
            await notion.pages.update({
                page_id: page.id,
                archived: true
            });
            deleted++;

            if (deleted % 50 === 0) {
                console.log(`   Eliminados: ${deleted}/${toDelete.length}`);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error: any) {
            console.log(`❌ Error eliminando: ${error.message}`);
        }
    }

    console.log(`\n✅ Eliminación completada: ${deleted} items archivados`);
}

deleteIncorrectMigrations().catch(console.error);

