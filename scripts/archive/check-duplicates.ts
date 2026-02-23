import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

const NEW_DBS = {
    "DB_AREAS": "2d7af5db-be15-81e9-9630-e633d6cf9075",
    "DB_SUBCATEGORIES": "2d7af5db-be15-81ba-95d5-dde79aa4269b",
    "DB_PROJECTS": "2d7af5db-be15-8196-82b3-d75c37b2ee36"
};

async function checkDuplicates(dbId: string, dbName: string) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📊 ${dbName}`);
    console.log("=".repeat(70));

    const pages = await notion.databases.query({
        database_id: dbId,
        page_size: 100
    });

    const titles: string[] = [];
    const duplicates: string[] = [];

    for (const page of pages.results) {
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

        if (titles.includes(title)) {
            duplicates.push(title);
            console.log(`   ⚠️  DUPLICADO: ${title}`);
        } else {
            titles.push(title);
            console.log(`   ✅ ${title}`);
        }
    }

    console.log(`\nTotal: ${pages.results.length} páginas`);
    console.log(`Únicos: ${titles.length - duplicates.length}`);
    console.log(`Duplicados: ${duplicates.length}`);

    return {
        dbName,
        total: pages.results.length,
        unique: titles.length - duplicates.length,
        duplicates: duplicates,
        allTitles: titles
    };
}

async function main() {
    console.log("🔍 VERIFICANDO DUPLICADOS EN CORE_NOTION\n");

    const results: any = {};

    for (const [name, id] of Object.entries(NEW_DBS)) {
        results[name] = await checkDuplicates(id, name);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log("\n\n📋 RESUMEN DE DUPLICADOS");
    console.log("=".repeat(70));

    let totalDuplicates = 0;
    for (const [dbName, data] of Object.entries(results)) {
        const d = data as any;
        console.log(`\n${dbName}:`);
        console.log(`   Total: ${d.total}`);
        console.log(`   Únicos: ${d.unique}`);
        console.log(`   Duplicados: ${d.duplicates.length}`);

        if (d.duplicates.length > 0) {
            console.log(`   Items duplicados: ${d.duplicates.join(', ')}`);
            totalDuplicates += d.duplicates.length;
        }
    }

    console.log(`\n\n⚠️  TOTAL DUPLICADOS ENCONTRADOS: ${totalDuplicates}`);

    if (totalDuplicates > 0) {
        console.log("\n🔧 ACCIÓN REQUERIDA: Limpiar duplicados antes de migración");
    } else {
        console.log("\n✅ No hay duplicados. Sistema listo para migración.");
    }

    writeFileSync('duplicate-check-report.json', JSON.stringify(results, null, 2));
    console.log("\n💾 Reporte guardado en duplicate-check-report.json");
}

main().catch(console.error);

