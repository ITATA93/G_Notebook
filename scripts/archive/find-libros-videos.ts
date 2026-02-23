import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

async function findSpecificDatabases() {
    console.log("🔍 BUSCANDO BD_LIBROS Y BD_VIDEOS EN TODO EL WORKSPACE\n");
    console.log("=".repeat(70));

    // Search for all databases
    const response = await notion.search({
        filter: {
            property: 'object',
            value: 'database'
        },
        page_size: 100
    });

    console.log(`\n📊 Total de bases de datos en workspace: ${response.results.length}\n`);

    const targetDBs: any[] = [];

    for (const db of response.results) {
        const database = db as any;
        const title = database.title?.[0]?.plain_text || "Untitled";

        // Look for Libros, Videos, and other important databases
        if (title.toLowerCase().includes('libro') ||
            title.toLowerCase().includes('video') ||
            title.toLowerCase().includes('repositorio') ||
            title.toLowerCase().includes('contexto')) {

            console.log(`\n📚 ${title}`);
            console.log(`   ID: ${database.id}`);
            console.log(`   Icon: ${database.icon?.emoji || "none"}`);

            try {
                const pages = await notion.databases.query({
                    database_id: database.id,
                    page_size: 100
                });

                console.log(`   Páginas: ${pages.results.length}`);

                // Get schema
                const dbInfo = await notion.databases.retrieve({ database_id: database.id });
                const props = (dbInfo as any).properties;
                console.log(`   Propiedades: ${Object.keys(props).join(', ')}`);

                targetDBs.push({
                    title,
                    id: database.id,
                    icon: database.icon?.emoji,
                    pageCount: pages.results.length,
                    properties: Object.keys(props)
                });

            } catch (error: any) {
                console.log(`   ⚠️ Error: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    console.log("\n\n📋 RESUMEN DE BASES ENCONTRADAS");
    console.log("=".repeat(70));

    for (const db of targetDBs) {
        console.log(`\n${db.icon || "📚"} ${db.title}`);
        console.log(`   Páginas: ${db.pageCount}`);
        console.log(`   Propiedades: ${db.properties.length}`);
    }

    // Save report
    const report = {
        totalFound: targetDBs.length,
        databases: targetDBs
    };

    writeFileSync('libros-videos-search.json', JSON.stringify(report, null, 2));
    console.log("\n\n💾 Reporte guardado en libros-videos-search.json");

    // Migration recommendations
    console.log("\n\n💡 PLAN DE MIGRACIÓN PARA ESTAS BASES");
    console.log("=".repeat(70));

    for (const db of targetDBs) {
        console.log(`\n📚 ${db.title} (${db.pageCount} páginas)`);
        console.log(`   Destino: DB_KNOWLEDGE_BASE`);
        console.log(`   Tipo: "${db.title.includes('Libro') ? 'Libro' : db.title.includes('Video') ? 'Video' : 'Recurso'}"`);
        console.log(`   Acción: Migrar completo con todas las propiedades`);
    }

    return targetDBs;
}

findSpecificDatabases().catch(console.error);

