import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

async function getFullDatabaseCount(dbId: string, dbName: string): Promise<number> {
    let allPages: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: dbId,
            start_cursor: startCursor,
            page_size: 100
        });

        allPages.push(...response.results);
        hasMore = response.has_more;
        startCursor = response.next_cursor || undefined;

        console.log(`   ${dbName}: ${allPages.length} páginas cargadas...`);

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    return allPages.length;
}

async function getCompleteCounts() {
    console.log("🔍 OBTENIENDO CONTEOS COMPLETOS (CON PAGINACIÓN)\n");
    console.log("=".repeat(70));

    const databases = {
        "BD_Libros": "64cd366b-5094-444e-bf55-2bb6e65225a5",
        "BD_Videos": "598e44a4-c24b-41ca-8d91-11923df13564",
        "Repositorio": "dd0b1cf9-151f-4b31-88b9-e53ad14d27a4",
        "BD_ContextoIA": "2bbaf5db-be15-81d6-a983-f667fc5e1783",
        "BD_Eventos y Tareas": "1ffaf5dbbe158000ad76e29c1fde1fed",
        "SBD_SubCategoría": "1feaf5dbbe15802fa0d3e0e55b42a23f",
        "BD_Categorias": "2bbaf5db-be15-80c3-b414-fabd8093c688",
        "SBD_Categoría": "214af5dbbe1580c098f3c5ce5b4c6b48",
        "BD_Clases": "aa80acb0-957f-4e97-bbca-c402948c26cb",
        "BD_Correos": "2b6af5db-be15-8031-8948-c73ed87c330a",
        "BD_Paginas": "2bbaf5db-be15-8166-b260-d0ae147b8525"
    };

    const counts: Record<string, number> = {};

    for (const [name, id] of Object.entries(databases)) {
        console.log(`\n📊 ${name}...`);
        try {
            const count = await getFullDatabaseCount(id, name);
            counts[name] = count;
            console.log(`   ✅ Total: ${count} páginas\n`);
        } catch (error: any) {
            console.log(`   ❌ Error: ${error.message}\n`);
            counts[name] = 0;
        }
    }

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("📊 RESUMEN COMPLETO");
    console.log("=".repeat(70));

    let totalPages = 0;

    console.log("\n🗄️  BASES DE DATOS CON CONTENIDO:");
    for (const [name, count] of Object.entries(counts)) {
        if (count > 0) {
            console.log(`   ${name}: ${count} páginas`);
            totalPages += count;
        }
    }

    console.log(`\n📊 TOTAL DE PÁGINAS A MIGRAR: ${totalPages}`);

    // Save report
    const report = {
        timestamp: new Date().toISOString(),
        databases: counts,
        totalPages
    };

    writeFileSync('complete-page-counts.json', JSON.stringify(report, null, 2));
    console.log("\n💾 Reporte guardado en complete-page-counts.json");

    return counts;
}

getCompleteCounts().catch(console.error);

