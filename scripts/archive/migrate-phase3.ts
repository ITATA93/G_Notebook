import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN || process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

// Database IDs
const DB_IDS = {
    BD_Libros: "64cd366b-5094-444e-bf55-2bb6e65225a5",
    BD_Videos: "598e44a4-c24b-41ca-8d91-11923df13564",
    Repositorio: "dd0b1cf9-151f-4b31-88b9-e53ad14d27a4",
    DB_KNOWLEDGE_BASE: "" // Will find
};

interface MigrationStats {
    libros: number;
    videos: number;
    repositorio: number;
    duplicatesSkipped: number;
    errors: number;
}

const stats: MigrationStats = {
    libros: 0,
    videos: 0,
    repositorio: 0,
    duplicatesSkipped: 0,
    errors: 0
};

async function getAllPages(dbId: string): Promise<any[]> {
    let allPages: any[] = [];
    let hasMore = true;
    let cursor: string | undefined;

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: dbId,
            start_cursor: cursor,
            page_size: 100
        });
        allPages.push(...response.results);
        hasMore = response.has_more;
        cursor = response.next_cursor || undefined;

        if (allPages.length % 100 === 0) {
            console.log(`   Cargadas ${allPages.length} páginas...`);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
    }
    return allPages;
}

function extractTitle(page: any): string {
    for (const prop of Object.values(page.properties) as any[]) {
        if (prop.type === 'title' && prop.title?.[0]?.plain_text) {
            return prop.title[0].plain_text;
        }
    }
    return "";
}

function normalize(text: string): string {
    return text.toLowerCase().trim();
}

async function findKnowledgeBase() {
    console.log("🔍 Buscando DB_KNOWLEDGE_BASE...\n");

    const response = await notion.search({
        filter: { property: 'object', value: 'database' },
        page_size: 100
    });

    for (const db of response.results) {
        const d = db as any;
        const title = d.title?.[0]?.plain_text || "";

        if (title.includes("Conocimiento") || title.includes("Knowledge")) {
            DB_IDS.DB_KNOWLEDGE_BASE = d.id;
            console.log(`✅ Encontrado: ${title} (${d.id})\n`);
            return;
        }
    }
}

// PHASE 3.1: Migrate BD_Libros
async function migrateLibros() {
    console.log("\n📚 FASE 3.1: MIGRANDO BD_LIBROS\n");
    console.log("=".repeat(70));

    const libros = await getAllPages(DB_IDS.BD_Libros);
    console.log(`✅ Cargados ${libros.length} libros\n`);

    const BATCH_SIZE = 50;

    for (let i = 0; i < libros.length; i += BATCH_SIZE) {
        const batch = libros.slice(i, i + BATCH_SIZE);

        for (const libro of batch) {
            const titulo = extractTitle(libro);

            if (!titulo) {
                stats.errors++;
                continue;
            }

            try {
                await notion.pages.create({
                    parent: { database_id: DB_IDS.DB_KNOWLEDGE_BASE },
                    properties: {
                        "Nombre": { title: [{ text: { content: titulo } }] },
                        "Tipo": { select: { name: "Libro" } },
                        "Etiquetas": { multi_select: [{ name: "Biblioteca" }] }
                    }
                });

                stats.libros++;

                if (stats.libros % 50 === 0) {
                    console.log(`✅ Libros: ${stats.libros}/${libros.length}`);
                }

            } catch (error: any) {
                console.log(`❌ Error: ${titulo}`);
                stats.errors++;
            }

            await new Promise(resolve => setTimeout(resolve, 400));
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n✅ Fase 3.1 completada: ${stats.libros} libros migrados\n`);
}

// PHASE 3.2: Migrate BD_Videos
async function migrateVideos() {
    console.log("\n📹 FASE 3.2: MIGRANDO BD_VIDEOS\n");
    console.log("=".repeat(70));

    const videos = await getAllPages(DB_IDS.BD_Videos);
    console.log(`✅ Cargados ${videos.length} videos\n`);

    const BATCH_SIZE = 50;

    for (let i = 0; i < videos.length; i += BATCH_SIZE) {
        const batch = videos.slice(i, i + BATCH_SIZE);

        for (const video of batch) {
            const titulo = extractTitle(video);

            if (!titulo) {
                stats.errors++;
                continue;
            }

            try {
                await notion.pages.create({
                    parent: { database_id: DB_IDS.DB_KNOWLEDGE_BASE },
                    properties: {
                        "Nombre": { title: [{ text: { content: titulo } }] },
                        "Tipo": { select: { name: "Video" } },
                        "Etiquetas": { multi_select: [{ name: "Videoteca" }] }
                    }
                });

                stats.videos++;

                if (stats.videos % 50 === 0) {
                    console.log(`✅ Videos: ${stats.videos}/${videos.length}`);
                }

            } catch (error: any) {
                console.log(`❌ Error: ${titulo}`);
                stats.errors++;
            }

            await new Promise(resolve => setTimeout(resolve, 400));
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n✅ Fase 3.2 completada: ${stats.videos} videos migrados\n`);
}

// PHASE 3.3: Migrate Repositorio with deduplication
async function migrateRepositorio() {
    console.log("\n📦 FASE 3.3: MIGRANDO REPOSITORIO (CON DEDUPLICACIÓN)\n");
    console.log("=".repeat(70));

    // Get existing titles to check for duplicates
    console.log("📊 Cargando títulos existentes para deduplicación...");
    const existing = await getAllPages(DB_IDS.DB_KNOWLEDGE_BASE);
    const existingTitles = new Set(existing.map(p => normalize(extractTitle(p))));
    console.log(`✅ ${existingTitles.size} títulos existentes cargados\n`);

    const repo = await getAllPages(DB_IDS.Repositorio);
    console.log(`✅ Cargados ${repo.length} items del repositorio\n`);

    const BATCH_SIZE = 50;

    for (let i = 0; i < repo.length; i += BATCH_SIZE) {
        const batch = repo.slice(i, i + BATCH_SIZE);

        for (const item of batch) {
            const titulo = extractTitle(item);

            if (!titulo) {
                stats.errors++;
                continue;
            }

            // Check for duplicates
            if (existingTitles.has(normalize(titulo))) {
                stats.duplicatesSkipped++;
                continue;
            }

            try {
                await notion.pages.create({
                    parent: { database_id: DB_IDS.DB_KNOWLEDGE_BASE },
                    properties: {
                        "Nombre": { title: [{ text: { content: titulo } }] },
                        "Tipo": { select: { name: "Recurso Académico - Pregrado" } },
                        "Etiquetas": { multi_select: [{ name: "Pregrado" }, { name: "Repositorio" }] }
                    }
                });

                stats.repositorio++;
                existingTitles.add(normalize(titulo)); // Update cache

                if (stats.repositorio % 100 === 0) {
                    console.log(`✅ Repositorio: ${stats.repositorio}/${repo.length} | Duplicados omitidos: ${stats.duplicatesSkipped}`);
                }

            } catch (error: any) {
                console.log(`❌ Error: ${titulo}`);
                stats.errors++;
            }

            await new Promise(resolve => setTimeout(resolve, 400));
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n✅ Fase 3.3 completada: ${stats.repositorio} items migrados, ${stats.duplicatesSkipped} duplicados omitidos\n`);
}

async function executePhase3() {
    console.log("🚀 INICIANDO FASE 3: REPOSITORIOS ACADÉMICOS\n");
    console.log("=".repeat(70));

    const startTime = Date.now();

    try {
        await findKnowledgeBase();

        await migrateLibros();
        await migrateVideos();
        await migrateRepositorio();

        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

        console.log("\n\n" + "=".repeat(70));
        console.log("✅ FASE 3 COMPLETADA");
        console.log("=".repeat(70));
        console.log(`\nResumen:`);
        console.log(`  - Libros migrados: ${stats.libros}`);
        console.log(`  - Videos migrados: ${stats.videos}`);
        console.log(`  - Repositorio migrado: ${stats.repositorio}`);
        console.log(`  - Duplicados omitidos: ${stats.duplicatesSkipped}`);
        console.log(`  - Total migrado: ${stats.libros + stats.videos + stats.repositorio}`);
        console.log(`  - Errores: ${stats.errors}`);
        console.log(`  - Duración: ${duration} minutos`);

        writeFileSync('phase3-migration-log.json', JSON.stringify({
            timestamp: new Date().toISOString(),
            duration: `${duration} min`,
            summary: stats
        }, null, 2));

        console.log(`\n💾 Log guardado en phase3-migration-log.json`);

    } catch (error) {
        console.error("\n❌ Error en Fase 3:", error);
        throw error;
    }
}

executePhase3().catch(console.error);

