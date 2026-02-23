import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN || process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

// Database IDs
const DB_IDS = {
    BD_Eventos_Tareas: "1ffaf5dbbe158000ad76e29c1fde1fed",
    DB_MEETINGS_CLASSES: "2d7af5db-be15-8111-a1d3-e5e5e5e5e5e5",  // Need to find
    DB_MASTER_TASKS: "2d7af5db-be15-8111-a1d3-f5f5f5f5f5f5"  // Need to find
};

interface MigrationLog {
    phase: string;
    action: string;
    item: string;
    type: string;
    status: 'success' | 'skip' | 'error';
    details?: string;
}

const migrationLog: MigrationLog[] = [];
let stats = {
    eventos: 0,
    tareas: 0,
    errors: 0,
    skipped: 0
};

function log(entry: MigrationLog) {
    migrationLog.push(entry);
    const emoji = entry.status === 'success' ? '✅' : entry.status === 'skip' ? '⏭️' : '❌';
    console.log(`${emoji} ${entry.type}: ${entry.item}`);
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

function extractSelect(page: any, propName: string): string {
    const prop = page.properties[propName];
    return prop?.select?.name || "";
}

function extractDate(page: any, propName: string): any {
    const prop = page.properties[propName];
    return prop?.date || null;
}

function extractNumber(page: any, propName: string): number | null {
    const prop = page.properties[propName];
    return prop?.number || null;
}

function isEvento(tipo: string): boolean {
    if (!tipo) return false;
    const tipoLower = tipo.toLowerCase();
    return tipoLower.includes('evento') ||
        tipoLower.includes('reunión') ||
        tipoLower.includes('reunion') ||
        tipoLower.includes('clase') ||
        tipoLower.includes('meeting');
}

async function findCoreDBs() {
    console.log("🔍 Buscando bases de datos de destino...\n");

    const response = await notion.search({
        filter: { property: 'object', value: 'database' },
        page_size: 100
    });

    for (const db of response.results) {
        const d = db as any;
        const title = d.title?.[0]?.plain_text || "";

        if (title.includes("Reuniones") || title.includes("Meetings")) {
            DB_IDS.DB_MEETINGS_CLASSES = d.id;
            console.log(`✅ Encontrado: ${title} (${d.id})`);
        }
        if (title.includes("Tareas Maestras") || title.includes("Master Tasks")) {
            DB_IDS.DB_MASTER_TASKS = d.id;
            console.log(`✅ Encontrado: ${title} (${d.id})`);
        }
    }

    console.log("");
}

async function migrateEventosTareas() {
    console.log("\n📦 FASE 2: MIGRANDO EVENTOS Y TAREAS\n");
    console.log("=".repeat(70));

    // Find target databases
    await findCoreDBs();

    // Load all items
    console.log("\n📊 Cargando BD_Eventos y Tareas...");
    const allItems = await getAllPages(DB_IDS.BD_Eventos_Tareas);
    console.log(`✅ Cargados ${allItems.length} items\n`);

    console.log("🔄 Procesando items...\n");

    const BATCH_SIZE = 20;
    let processed = 0;

    for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
        const batch = allItems.slice(i, i + BATCH_SIZE);

        for (const item of batch) {
            const titulo = extractTitle(item);
            const tipo = extractSelect(item, "Tipo");
            const fecha = extractDate(item, "Fecha Inicio");
            const estado = extractSelect(item, "Estado");

            if (!titulo) {
                log({ phase: '2', action: 'Skip', item: 'Sin título', type: 'Unknown', status: 'skip' });
                stats.skipped++;
                continue;
            }

            const esEvento = isEvento(tipo);
            const targetDB = esEvento ? DB_IDS.DB_MEETINGS_CLASSES : DB_IDS.DB_MASTER_TASKS;
            const targetType = esEvento ? "Evento" : "Tarea";

            try {
                const properties: any = {};

                if (esEvento) {
                    // Evento/Reunión
                    properties["Título"] = { title: [{ text: { content: titulo } }] };
                    if (fecha) properties["Fecha"] = { date: fecha };
                    if (tipo) properties["Tipo"] = { select: { name: tipo } };
                    if (estado) properties["Estado"] = { select: { name: estado } };

                    const duracion = extractNumber(item, "Duracion");
                    if (duracion) properties["Duración"] = { number: duracion };
                } else {
                    // Tarea
                    properties["Nombre"] = { title: [{ text: { content: titulo } }] };
                    if (fecha) properties["Fecha Límite"] = { date: fecha };
                    if (estado) properties["Estado"] = { select: { name: estado } };
                }

                await notion.pages.create({
                    parent: { database_id: targetDB },
                    properties
                });

                log({
                    phase: '2',
                    action: 'Migrar',
                    item: titulo,
                    type: targetType,
                    status: 'success'
                });

                if (esEvento) stats.eventos++;
                else stats.tareas++;

            } catch (error: any) {
                log({
                    phase: '2',
                    action: 'Error',
                    item: titulo,
                    type: targetType,
                    status: 'error',
                    details: error.message
                });
                stats.errors++;
            }

            await new Promise(resolve => setTimeout(resolve, 400));
        }

        processed += batch.length;
        const progress = ((processed / allItems.length) * 100).toFixed(1);
        console.log(`\n📊 Progreso: ${processed}/${allItems.length} (${progress}%)`);
        console.log(`   Eventos: ${stats.eventos} | Tareas: ${stats.tareas} | Errores: ${stats.errors}\n`);

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return stats;
}

async function executePhase2() {
    console.log("🚀 INICIANDO FASE 2: EVENTOS Y TAREAS\n");
    console.log("=".repeat(70));

    const startTime = Date.now();

    try {
        const results = await migrateEventosTareas();

        const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

        console.log("\n\n" + "=".repeat(70));
        console.log("✅ FASE 2 COMPLETADA");
        console.log("=".repeat(70));
        console.log(`\nResumen:`);
        console.log(`  - Eventos migrados: ${results.eventos}`);
        console.log(`  - Tareas migradas: ${results.tareas}`);
        console.log(`  - Total procesado: ${results.eventos + results.tareas}`);
        console.log(`  - Errores: ${results.errors}`);
        console.log(`  - Omitidos: ${results.skipped}`);
        console.log(`  - Duración: ${duration} minutos`);

        // Save log
        writeFileSync('phase2-migration-log.json', JSON.stringify({
            timestamp: new Date().toISOString(),
            duration: `${duration} min`,
            summary: results,
            log: migrationLog
        }, null, 2));

        console.log(`\n💾 Log guardado en phase2-migration-log.json`);

    } catch (error) {
        console.error("\n❌ Error en Fase 2:", error);
        throw error;
    }
}

executePhase2().catch(console.error);

