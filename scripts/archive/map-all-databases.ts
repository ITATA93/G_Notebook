import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

// Todas las bases de datos visibles en la imagen de Config
const ALL_DATABASES = {
    // Bases de Datos principales
    "BD_Clases": "aa80acb0-957f-4e97-bbca-c402948c26cb",
    "BD_Eventos y Tareas": "1ffaf5dbbe158000ad76e29c1fde1fed",
    "BD_Proyectos": "2bbaf5db-be15-81cd-9292-e4edfb5202f9",
    "BD_Subcategorias": "2bbaf5db-be15-8088-9784-ec6b35618e0d",
    "BD_Categorias": "2bbaf5db-be15-80c3-b414-fabd8093c688",
    "BD_Objetivos": "2bbaf5db-be15-8158-90f1-de1d6b1b1d33",
    "BD_Correos": "2b6af5db-be15-8031-8948-c73ed87c330a",
    "BD_Videos": "598e44a4-c24b-41ca-8d91-11923df13564",
    "BD_Libros": "64cd366b-5094-444e-bf55-2bb6e65225a5",
    "BD_Paginas": "2bbaf5db-be15-8166-b260-d0ae147b8525",
    "BD_ContextoIA": "2bbaf5db-be15-81d6-a983-f667fc5e1783",
    "SBD_SubCategoría": "1feaf5dbbe15802fa0d3e0e55b42a23f",
    "SBD_Categoría": "214af5dbbe1580c098f3c5ce5b4c6b48",

    // Respaldos
    "RESPALDO": "20daf5dbbe1580a08e88dd9946470921",

    // Otras
    "Repositorio": "dd0b1cf9-151f-4b31-88b9-e53ad14d27a4",
    "Tareas (Config)": "2ccaf5db-be15-8055-89ef-c9cb0e1f2197"
};

async function getAllPagesWithPagination(dbId: string, dbName: string): Promise<number> {
    let allPages: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    try {
        while (hasMore) {
            const response = await notion.databases.query({
                database_id: dbId,
                start_cursor: startCursor,
                page_size: 100
            });

            allPages.push(...response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;

            if (allPages.length % 100 === 0 && allPages.length > 0) {
                console.log(`   ${dbName}: ${allPages.length} páginas...`);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        return allPages.length;
    } catch (error: any) {
        console.log(`   ⚠️ Error: ${error.message}`);
        return 0;
    }
}

async function mapAllDatabases() {
    console.log("🔍 MAPEO COMPLETO DE TODAS LAS BASES DE DATOS\n");
    console.log("=".repeat(70));

    const results: any[] = [];

    for (const [name, id] of Object.entries(ALL_DATABASES)) {
        console.log(`\n📊 ${name}...`);

        const pageCount = await getAllPagesWithPagination(id, name);

        // Get schema
        let properties: string[] = [];
        try {
            const dbInfo = await notion.databases.retrieve({ database_id: id });
            const props = (dbInfo as any).properties;
            properties = Object.keys(props);
        } catch (error) {
            // Skip if can't access
        }

        results.push({
            name,
            id,
            pageCount,
            propertyCount: properties.length,
            properties
        });

        console.log(`   ✅ ${pageCount} páginas, ${properties.length} propiedades`);

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Clasificar
    console.log("\n\n📋 CLASIFICACIÓN DE BASES DE DATOS");
    console.log("=".repeat(70));

    const classification = {
        critical: results.filter(db =>
            db.name.includes('SBD_SubCategoría') ||
            db.name.includes('BD_Eventos') ||
            db.name.includes('SBD_Categoría')
        ),
        repositories: results.filter(db =>
            db.name.includes('Libros') ||
            db.name.includes('Videos') ||
            db.name.includes('Repositorio')
        ),
        empty: results.filter(db => db.pageCount === 0),
        backup: results.filter(db =>
            db.name.includes('RESPALDO') ||
            db.name.includes('BD_Proyectos') ||
            db.name.includes('BD_Subcategorias') ||
            db.name.includes('BD_Objetivos')
        ),
        complementary: results.filter(db =>
            db.pageCount > 0 &&
            !db.name.includes('SBD') &&
            !db.name.includes('Libros') &&
            !db.name.includes('Videos') &&
            !db.name.includes('Repositorio') &&
            !db.name.includes('BD_Eventos') &&
            !db.name.includes('RESPALDO') &&
            !db.name.includes('BD_Proyectos') &&
            !db.name.includes('BD_Subcategorias') &&
            !db.name.includes('BD_Objetivos')
        )
    };

    console.log("\n⭐ CRÍTICAS (IDs de sincronización):");
    let criticalTotal = 0;
    for (const db of classification.critical) {
        console.log(`   ${db.name}: ${db.pageCount} páginas`);
        criticalTotal += db.pageCount;
    }
    console.log(`   SUBTOTAL: ${criticalTotal} páginas`);

    console.log("\n📚 REPOSITORIOS (Material académico/recursos):");
    let repoTotal = 0;
    for (const db of classification.repositories) {
        const note = db.name.includes('Repositorio') ? ' (Pregrado)' : '';
        console.log(`   ${db.name}: ${db.pageCount} páginas${note}`);
        repoTotal += db.pageCount;
    }
    console.log(`   SUBTOTAL: ${repoTotal} páginas`);

    console.log("\n📦 COMPLEMENTARIAS:");
    let compTotal = 0;
    for (const db of classification.complementary) {
        console.log(`   ${db.name}: ${db.pageCount} páginas`);
        compTotal += db.pageCount;
    }
    console.log(`   SUBTOTAL: ${compTotal} páginas`);

    console.log("\n❌ VACÍAS (Ignorar):");
    for (const db of classification.empty) {
        console.log(`   ${db.name}: ${db.pageCount} páginas`);
    }

    console.log("\n🗄️ RESPALDOS (Ignorar):");
    for (const db of classification.backup) {
        console.log(`   ${db.name}: ${db.pageCount} páginas`);
    }

    const totalToMigrate = criticalTotal + repoTotal + compTotal;
    console.log(`\n\n📊 TOTAL A MIGRAR: ${totalToMigrate} páginas`);

    // Save report
    const report = {
        timestamp: new Date().toISOString(),
        databases: results,
        classification,
        summary: {
            critical: criticalTotal,
            repositories: repoTotal,
            complementary: compTotal,
            total: totalToMigrate
        }
    };

    writeFileSync('complete-database-mapping.json', JSON.stringify(report, null, 2));
    console.log("\n💾 Mapeo completo guardado en complete-database-mapping.json");

    return report;
}

mapAllDatabases().catch(console.error);

