import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

// IDs confirmed from previous steps
const ID_SOURCE_LIBROS = "64cd366b-5094-444e-bf55-2bb6e65225a5";
const ID_TARGET_BIBLIOTECA = "2d7af5db-be15-8104-af63-f3fcc44c3235"; // ID from creation log

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

async function migrateLibrary() {
    console.log("📚 MIGRANDO BIBLIOTECA (Fase 3.1)\n");

    // 1. Get Source Pages
    console.log("📥 Cargando libros originales...");
    const sourceBooks = await getAllPages(ID_SOURCE_LIBROS);
    console.log(`✅ ${sourceBooks.length} libros encontrados.\n`);

    let success = 0;
    let errors = 0;
    const BATCH_SIZE = 10; // Smaller batch for safety with files

    for (let i = 0; i < sourceBooks.length; i += BATCH_SIZE) {
        const batch = sourceBooks.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (book: any) => {
            const p = book.properties;
            const title = p["Nombre"]?.title?.[0]?.plain_text || "Sin Título";

            try {
                // Construct properties object
                const properties: any = {
                    "Nombre": { title: [{ text: { content: title } }] }
                };

                // Map simple properties
                if (p["Autores"]?.multi_select) properties["Autores"] = { multi_select: p["Autores"].multi_select };
                if (p["Categoria"]?.select) properties["Categoría"] = { select: p["Categoria"].select };
                if (p["Etiquetas"]?.multi_select) properties["Etiquetas"] = { multi_select: p["Etiquetas"].multi_select };
                if (p["Año"]?.number) properties["Año"] = { number: p["Año"].number };
                if (p["ISBN"]?.number) properties["ISBN"] = { rich_text: [{ text: { content: String(p["ISBN"].number) } }] };

                // Map URLs
                if (p["Enlace Visor"]?.url) properties["Enlace Visor"] = { url: p["Enlace Visor"].url };
                if (p["Enlace Descarga"]?.url) properties["Enlace Descarga"] = { url: p["Enlace Descarga"].url };

                // Map Description
                if (p["Descripcion"]?.rich_text?.length > 0) {
                    properties["Descripción"] = { rich_text: p["Descripcion"].rich_text };
                }

                // Map Cover (Try 'Nombre Portada' first, then 'Enlace Portada Google Drive')
                // Note: Notion API requires files to be External URLs or Files uploaded via specialized endpoints (which we can't do purely with properties for uploads, but we can move External links)
                // If the source has 'files' type, we can copy the external object structure if it's external.
                // If it's internal Notion file, the link expires in 1 hour. We can verify.
                const coverFiles = p["Nombre Portada"]?.files || p["Enlace Portada Google Drive"]?.files || [];
                if (coverFiles.length > 0) {
                    // Filter only external files or valid URLs we can reuse
                    const validFiles = coverFiles.map((f: any) => {
                        if (f.type === "external") return { name: f.name, type: "external", external: f.external };
                        if (f.type === "file") return { name: f.name, type: "external", external: { url: f.file.url } }; // Copying internal URL (temporary fix, but functional for migration if fast enough)
                        return null;
                    }).filter(Boolean);

                    if (validFiles.length > 0) properties["Portada"] = { files: validFiles };
                }

                await notion.pages.create({
                    parent: { database_id: ID_TARGET_BIBLIOTECA },
                    properties: properties
                });
                success++;
                process.stdout.write("✅");

            } catch (error: any) {
                console.error(`\n❌ Error migrando "${title}": ${error.message}`);
                errors++;
            }
        }));

        // Rate limiting wait
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n\n🏁 Migración de Biblioteca finalizada.`);
    console.log(`   Exitosos: ${success} | Errores: ${errors}`);
}

migrateLibrary().catch(console.error);

