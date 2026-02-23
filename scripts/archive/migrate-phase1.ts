import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN || process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

// Database IDs
const DB_IDS = {
    DB_AREAS: "2d7af5db-be15-81e9-9630-e633d6cf9075",  // Áreas Maestras
    DB_PROJECTS: "2d7af5db-be15-8196-82b3-d75c37b2ee36",  // Proyectos Activos
    DB_SUBCATEGORIES: "2d7af5db-be15-81ba-95d5-dde79aa4269b",  // Subcategorías
    SBD_Categoria: "214af5dbbe1580c098f3c5ce5b4c6b48",
    SBD_SubCategoria: "1feaf5dbbe15802fa0d3e0e55b42a23f"
};

interface MigrationLog {
    phase: string;
    action: string;
    item: string;
    status: 'success' | 'skip' | 'error';
    details?: string;
}

const migrationLog: MigrationLog[] = [];

function log(entry: MigrationLog) {
    migrationLog.push(entry);
    const emoji = entry.status === 'success' ? '✅' : entry.status === 'skip' ? '⏭️' : '❌';
    console.log(`${emoji} ${entry.action}: ${entry.item} ${entry.details ? `(${entry.details})` : ''}`);
}

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

function extractRichText(page: any, propName: string): string {
    const prop = page.properties[propName];
    if (prop?.rich_text?.[0]?.plain_text) {
        return prop.rich_text[0].plain_text;
    }
    return "";
}

async function findPageByTitle(dbId: string, title: string): Promise<any | null> {
    const response = await notion.databases.query({
        database_id: dbId,
        filter: {
            property: "Nombre",
            title: {
                equals: title
            }
        }
    });
    return response.results[0] || null;
}

// PHASE 1.1: Enrich DB_AREAS with descriptions from SBD_Categoría
async function enrichAreas() {
    console.log("\n📦 FASE 1.1: ENRIQUECIENDO DB_AREAS CON DESCRIPCIONES\n");
    console.log("=".repeat(70));

    const sbdCategorias = await getAllPages(DB_IDS.SBD_Categoria);
    console.log(`\nCargadas ${sbdCategorias.length} categorías de SBD_Categoría`);

    let enriched = 0;
    let skipped = 0;

    for (const cat of sbdCategorias) {
        const nombre = extractTitle(cat);
        const descripcion = extractRichText(cat, "Descripción");

        if (!nombre) {
            log({ phase: '1.1', action: 'Skip', item: 'Sin título', status: 'skip' });
            skipped++;
            continue;
        }

        if (!descripcion) {
            log({ phase: '1.1', action: 'Skip', item: nombre, status: 'skip', details: 'Sin descripción' });
            skipped++;
            continue;
        }

        // Find matching area in DB_AREAS
        const existingArea = await findPageByTitle(DB_IDS.DB_AREAS, nombre);

        if (existingArea) {
            try {
                await notion.pages.update({
                    page_id: existingArea.id,
                    properties: {
                        "Descripción": {
                            rich_text: [{ text: { content: descripcion } }]
                        }
                    }
                });
                log({ phase: '1.1', action: 'Enriquecer', item: nombre, status: 'success' });
                enriched++;
            } catch (error: any) {
                log({ phase: '1.1', action: 'Error', item: nombre, status: 'error', details: error.message });
            }
        } else {
            log({ phase: '1.1', action: 'Skip', item: nombre, status: 'skip', details: 'No existe en DB_AREAS' });
            skipped++;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Fase 1.1 completada: ${enriched} enriquecidos, ${skipped} omitidos`);
    return { enriched, skipped };
}

// PHASE 1.2: Fuse SBD_SubCategoría with DB_PROJECTS/SUBCATEGORIES
async function fuseSubcategories() {
    console.log("\n\n📦 FASE 1.2: FUSIONANDO SBD_SUBCATEGORÍA\n");
    console.log("=".repeat(70));

    const sbdSub = await getAllPages(DB_IDS.SBD_SubCategoria);
    console.log(`\nCargadas ${sbdSub.length} subcategorías de SBD_SubCategoría`);

    let fused = 0;
    let skipped = 0;

    for (const item of sbdSub) {
        const titulo = extractTitle(item);
        const idCalendario = extractRichText(item, "ID Calendario");
        const idTask = extractRichText(item, "ID Task");
        const descripcion = extractRichText(item, "Descripcion");

        if (!titulo) {
            log({ phase: '1.2', action: 'Skip', item: 'Sin título', status: 'skip' });
            skipped++;
            continue;
        }

        // Determine if it's a project or subcategory
        const isProject =
            titulo.includes("Proyecto:") ||
            titulo.includes("Plan ") ||
            titulo.includes("Magister") ||
            titulo.includes("Diplomado") ||
            titulo.includes("Vacaciones");

        const targetDB = isProject ? DB_IDS.DB_PROJECTS : DB_IDS.DB_SUBCATEGORIES;
        const targetType = isProject ? "Proyecto" : "Subcategoría";

        // Find existing item
        const existing = await findPageByTitle(targetDB, titulo);

        if (existing) {
            try {
                const updates: any = {};

                if (descripcion) {
                    updates["Descripción"] = { rich_text: [{ text: { content: descripcion } }] };
                }

                if (isProject && idCalendario) {
                    updates["ID Calendario Facturación"] = { rich_text: [{ text: { content: idCalendario } }] };
                }

                if (isProject && idTask) {
                    updates["ID Lista Tareas"] = { rich_text: [{ text: { content: idTask } }] };
                }

                if (Object.keys(updates).length > 0) {
                    await notion.pages.update({
                        page_id: existing.id,
                        properties: updates
                    });
                    log({
                        phase: '1.2',
                        action: 'Fusionar',
                        item: titulo,
                        status: 'success',
                        details: `${targetType} - ${Object.keys(updates).join(', ')}`
                    });
                    fused++;
                } else {
                    log({ phase: '1.2', action: 'Skip', item: titulo, status: 'skip', details: 'Sin datos para fusionar' });
                    skipped++;
                }
            } catch (error: any) {
                log({ phase: '1.2', action: 'Error', item: titulo, status: 'error', details: error.message });
            }
        } else {
            log({ phase: '1.2', action: 'Skip', item: titulo, status: 'skip', details: `No existe en ${targetType}` });
            skipped++;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Fase 1.2 completada: ${fused} fusionados, ${skipped} omitidos`);
    return { fused, skipped };
}

async function executePhase1() {
    console.log("🚀 INICIANDO FASE 1: FUSIÓN CRÍTICA\n");
    console.log("=".repeat(70));

    const startTime = Date.now();

    try {
        const phase1_1 = await enrichAreas();
        const phase1_2 = await fuseSubcategories();

        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

        console.log("\n\n" + "=".repeat(70));
        console.log("✅ FASE 1 COMPLETADA");
        console.log("=".repeat(70));
        console.log(`\nResumen:`);
        console.log(`  - Áreas enriquecidas: ${phase1_1.enriched}`);
        console.log(`  - Subcategorías fusionadas: ${phase1_2.fused}`);
        console.log(`  - Total procesado: ${phase1_1.enriched + phase1_2.fused}`);
        console.log(`  - Duración: ${duration} minutos`);

        // Save log
        writeFileSync('phase1-migration-log.json', JSON.stringify({
            timestamp: new Date().toISOString(),
            duration: `${duration} min`,
            summary: {
                areasEnriched: phase1_1.enriched,
                subcategoriesFused: phase1_2.fused,
                totalProcessed: phase1_1.enriched + phase1_2.fused
            },
            log: migrationLog
        }, null, 2));

        console.log(`\n💾 Log guardado en phase1-migration-log.json`);

    } catch (error) {
        console.error("\n❌ Error en Fase 1:", error);
        throw error;
    }
}

executePhase1().catch(console.error);

