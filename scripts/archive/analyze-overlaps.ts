import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

const DBS = {
    "Repositorio": "dd0b1cf9-151f-4b31-88b9-e53ad14d27a4",
    "BD_Libros": "64cd366b-5094-444e-bf55-2bb6e65225a5",
    "BD_Videos": "598e44a4-c24b-41ca-8d91-11923df13564",
    "SBD_SubCategoría": "1feaf5dbbe15802fa0d3e0e55b42a23f",
    "SBD_Categoría": "214af5dbbe1580c098f3c5ce5b4c6b48",
    "Tareas_Config": "2ccaf5db-be15-8055-89ef-c9cb0e1f2197"
};

async function getTitlesSample(dbId: string, limit: number = 200): Promise<Set<string>> {
    const titles = new Set<string>();
    let hasMore = true;
    let cursor: string | undefined;

    while (hasMore && titles.size < limit) {
        const response = await notion.databases.query({
            database_id: dbId,
            start_cursor: cursor,
            page_size: 100
        });

        for (const page of response.results) {
            const p = page as any;
            let title = "";

            // Find title property
            for (const prop of Object.values(p.properties) as any[]) {
                if (prop.type === 'title') {
                    title = prop.title?.[0]?.plain_text || "";
                    break;
                }
            }

            if (title) titles.add(title.trim().toLowerCase());
        }

        hasMore = response.has_more;
        cursor = response.next_cursor || undefined;
    }

    return titles;
}

async function analyzeOverlaps() {
    console.log("🔍 ANALIZANDO SOLAPAMIENTOS Y DUPLICADOS\n");

    // 1. Repositorio vs Libros vs Videos
    console.log("📊 Cargando muestras de Repositorios Académicos...");
    const repoTitles = await getTitlesSample(DBS.Repositorio, 500);
    const librosTitles = await getTitlesSample(DBS.BD_Libros, 500);
    const videosTitles = await getTitlesSample(DBS.BD_Videos, 500);

    console.log(`   Repositorio (Muestra): ${repoTitles.size}`);
    console.log(`   Libros (Muestra): ${librosTitles.size}`);
    console.log(`   Videos (Muestra): ${videosTitles.size}`);

    // Check Overlaps
    const repoLibrosOverlap = [...repoTitles].filter(t => librosTitles.has(t));
    const repoVideosOverlap = [...repoTitles].filter(t => videosTitles.has(t));
    const librosVideosOverlap = [...librosTitles].filter(t => videosTitles.has(t));

    console.log("\n⚔️ SOLAPAMIENTOS:");
    console.log(`   Repositorio vs Libros: ${repoLibrosOverlap.length} coincidencias`);
    if (repoLibrosOverlap.length > 0) console.log(`      Ej: ${repoLibrosOverlap.slice(0, 3).join(", ")}`);

    console.log(`   Repositorio vs Videos: ${repoVideosOverlap.length} coincidencias`);
    if (repoVideosOverlap.length > 0) console.log(`      Ej: ${repoVideosOverlap.slice(0, 3).join(", ")}`);

    console.log(`   Libros vs Videos: ${librosVideosOverlap.length} coincidencias`);

    // 2. SBD_SubCategoría vs SBD_Categoría
    console.log("\n📊 Analizando Legacy Categories...");
    const subCatTitles = await getTitlesSample(DBS.SBD_SubCategoría, 100);
    const catTitles = await getTitlesSample(DBS.SBD_Categoría, 100);

    const catOverlap = [...subCatTitles].filter(t => catTitles.has(t));
    console.log(`   SBD_SubCategoría vs SBD_Categoría: ${catOverlap.length} coincidencias`);
    if (catOverlap.length > 0) console.log(`      Ej: ${catOverlap.slice(0, 5).join(", ")}`);

    // 3. Check Tareas Config
    console.log("\n📊 Analizando Tareas (Config)...");
    const tareasConfig = await notion.databases.query({ database_id: DBS.Tareas_Config });
    if (tareasConfig.results.length > 0) {
        const p = tareasConfig.results[0] as any;
        console.log(`   Item: ${p.properties.Name?.title?.[0]?.plain_text || "Untitled"}`);
        console.log(`   Props: ${Object.keys(p.properties).join(", ")}`);
    }

    // Save report
    const report = {
        overlaps: {
            repo_libros: repoLibrosOverlap,
            repo_videos: repoVideosOverlap,
            libros_videos: librosVideosOverlap,
            subcat_cat: catOverlap
        }
    };

    writeFileSync('overlap-analysis.json', JSON.stringify(report, null, 2));
    console.log("\n💾 Reporte guardado en overlap-analysis.json");
}

analyzeOverlaps().catch(console.error);

