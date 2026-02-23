import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

const ID_SOURCE_VIDEOS = "598e44a4-c24b-41ca-8d91-11923df13564";
const ID_TARGET_VIDEOTECA = "2d7af5db-be15-810f-8060-c2e5890e0707";

async function getAllPages(dbId: string) {
    let pages: any[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    while (hasMore) {
        const res = await notion.databases.query({
            database_id: dbId,
            start_cursor: cursor,
            page_size: 100
        });
        pages.push(...res.results);
        hasMore = res.has_more;
        cursor = res.next_cursor || undefined;
    }
    return pages;
}

async function migrateVideotheque() {
    console.log("📹 MIGRANDO VIDEOTECA (Fase 3.2)\n");

    console.log("📥 Cargando videos originales...");
    const sourceVideos = await getAllPages(ID_SOURCE_VIDEOS);
    console.log(`✅ ${sourceVideos.length} videos encontrados.\n`);

    let success = 0;
    let errors = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < sourceVideos.length; i += BATCH_SIZE) {
        const batch = sourceVideos.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (video: any) => {
            const p = video.properties;
            const title = p["Nombre del Post"]?.title?.[0]?.plain_text || "Sin Título";

            try {
                const properties: any = {
                    "Título": { title: [{ text: { content: title } }] }
                };

                // Selects Sanitization
                if (p["Especialidad"]?.select) properties["Especialidad"] = { select: { name: p["Especialidad"].select.name } };
                if (p["Institucion"]?.select) properties["Institución"] = { select: { name: p["Institucion"].select.name } };
                if (p["Instancia"]?.select) properties["Instancia"] = { select: { name: p["Instancia"].select.name } };

                // Number
                if (p["Año"]?.number) properties["Año"] = { number: p["Año"].number };

                // Description (from GD Video File Name)
                if (p["GD Video File Name"]?.rich_text) {
                    properties["Descripción"] = { rich_text: p["GD Video File Name"].rich_text };
                }

                // File Handling (Captura)
                const files = p["Captura"]?.files || [];
                if (files.length > 0) {
                    const validFiles = files.filter((f: any) => f.type === "external").map((f: any) => ({
                        name: f.name,
                        type: "external",
                        external: f.external
                    }));

                    if (validFiles.length > 0) {
                        properties["Archivo Video"] = { files: validFiles };
                    }
                }

                await notion.pages.create({
                    parent: { database_id: ID_TARGET_VIDEOTECA },
                    properties: properties
                });
                success++;
                process.stdout.write("✅");

            } catch (error: any) {
                console.error(`\n❌ Error migrando "${title}": ${error.message}`);
                errors++;
            }
        }));

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n\n🏁 Migración de Videoteca finalizada.`);
    console.log(`   Exitosos: ${success} | Errores: ${errors}`);

    writeFileSync('phase3.2-videotheque-log.json', JSON.stringify({ total: sourceVideos.length, success, errors }, null, 2));
}

migrateVideotheque().catch(console.error);

