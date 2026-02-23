import { Client } from "@notionhq/client";
import { readFileSync, writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

const DB_IDS = {
    BD_Eventos_Tareas: "1ffaf5dbbe158000ad76e29c1fde1fed",
    DB_MASTER_TASKS: "2d7af5db-be15-8127-8d03-c72f11529b00"
};

async function retryFailedTasks() {
    console.log("🔄 REINTENTANDO TAREAS FALLIDAS\n");
    console.log("=".repeat(70));

    // Read previous log
    const prevLog = JSON.parse(readFileSync('phase2-migration-log.json', 'utf-8'));
    const failedTasks = prevLog.log.filter((entry: any) =>
        entry.status === 'error' && entry.type === 'Tarea'
    );

    console.log(`\n📊 Tareas fallidas a reintentar: ${failedTasks.length}\n`);

    let success = 0;
    let errors = 0;

    for (const task of failedTasks) {
        const titulo = task.item;

        try {
            const properties: any = {
                "Nombre": { title: [{ text: { content: titulo } }] }
            };

            await notion.pages.create({
                parent: { database_id: DB_IDS.DB_MASTER_TASKS },
                properties
            });

            console.log(`✅ ${titulo}`);
            success++;

        } catch (error: any) {
            console.log(`❌ ${titulo}: ${error.message}`);
            errors++;
        }

        await new Promise(resolve => setTimeout(resolve, 400));

        if ((success + errors) % 50 === 0) {
            console.log(`\n📊 Progreso: ${success + errors}/${failedTasks.length}`);
            console.log(`   Exitosas: ${success} | Errores: ${errors}\n`);
        }
    }

    console.log("\n\n" + "=".repeat(70));
    console.log("✅ CORRECCIÓN COMPLETADA");
    console.log("=".repeat(70));
    console.log(`\nResumen:`);
    console.log(`  - Tareas migradas: ${success}`);
    console.log(`  - Errores: ${errors}`);
    console.log(`  - Total procesado: ${success + errors}`);

    // Update summary
    const totalEventos = prevLog.summary.eventos;
    const totalTareas = prevLog.summary.tareas + success;

    console.log(`\n📊 RESUMEN FINAL FASE 2:`);
    console.log(`  - Eventos: ${totalEventos}`);
    console.log(`  - Tareas: ${totalTareas}`);
    console.log(`  - TOTAL: ${totalEventos + totalTareas}`);

    writeFileSync('phase2-fix-log.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        retriedTasks: failedTasks.length,
        success,
        errors,
        finalSummary: {
            eventos: totalEventos,
            tareas: totalTareas,
            total: totalEventos + totalTareas
        }
    }, null, 2));

    console.log(`\n💾 Log guardado en phase2-fix-log.json`);
}

retryFailedTasks().catch(console.error);

