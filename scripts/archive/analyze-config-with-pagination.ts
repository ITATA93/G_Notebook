import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const CONFIG_PAGE_ID = "1feaf5dbbe15805dbdf5efd47ff793e7";

const notion = new Client({ auth: TOKEN });

async function getAllPagesWithPagination(dbId: string): Promise<any[]> {
    let allPages: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: dbId,
            start_cursor: startCursor,
            page_size: 100
        });

        allPages.push(...response.results);
        hasMore = response.has_more;
        startCursor = response.next_cursor || undefined;

        await new Promise(resolve => setTimeout(resolve, 300));
    }

    return allPages;
}

async function exploreConfigRecursive(blockId: string, depth: number = 0, discovered: any[] = []): Promise<any[]> {
    const indent = "  ".repeat(depth);

    try {
        let allBlocks: any[] = [];
        let hasMore = true;
        let startCursor: string | undefined;

        // Get all blocks with pagination
        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: blockId,
                start_cursor: startCursor,
                page_size: 100
            });

            allBlocks.push(...response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        for (const block of allBlocks) {
            const b = block as any;

            if (b.type === 'child_database') {
                const dbTitle = b.child_database?.title || "Untitled DB";
                console.log(`${indent}🗄️  ${dbTitle}`);

                try {
                    const pages = await getAllPagesWithPagination(b.id);
                    console.log(`${indent}   📊 ${pages.length} páginas`);

                    discovered.push({
                        type: 'database',
                        id: b.id,
                        title: dbTitle,
                        pageCount: pages.length,
                        depth
                    });
                } catch (error: any) {
                    console.log(`${indent}   ⚠️ Error: ${error.message}`);
                }

            } else if (b.type === 'child_page') {
                const pageTitle = b.child_page?.title || "Untitled Page";
                console.log(`${indent}📄 ${pageTitle}`);

                discovered.push({
                    type: 'page',
                    id: b.id,
                    title: pageTitle,
                    depth
                });

                // Explore recursively
                await new Promise(resolve => setTimeout(resolve, 300));
                await exploreConfigRecursive(b.id, depth + 1, discovered);
            }
        }
    } catch (error: any) {
        console.log(`${indent}⚠️ Error: ${error.message}`);
    }

    return discovered;
}

async function analyzeConfigComplete() {
    console.log("🔍 ANÁLISIS COMPLETO DE CONFIG (CON PAGINACIÓN)\n");
    console.log("=".repeat(70));

    const configPage = await notion.pages.retrieve({ page_id: CONFIG_PAGE_ID }) as any;
    const configTitle = configPage.properties.title?.title?.[0]?.plain_text || "Config";

    console.log(`\n📄 Página Raíz: ${configTitle}\n`);

    const discovered = await exploreConfigRecursive(CONFIG_PAGE_ID);

    // Summary
    console.log("\n\n📊 RESUMEN COMPLETO");
    console.log("=".repeat(70));

    const databases = discovered.filter(d => d.type === 'database');
    const pages = discovered.filter(d => d.type === 'page');

    console.log(`\n🗄️  Bases de Datos: ${databases.length}`);
    let totalPages = 0;
    for (const db of databases) {
        console.log(`   ${db.title}: ${db.pageCount} páginas`);
        totalPages += db.pageCount;
    }

    console.log(`\n📄 Páginas de Documentación: ${pages.length}`);
    for (const page of pages) {
        console.log(`   - ${page.title}`);
    }

    console.log(`\n📊 TOTAL DE PÁGINAS EN BASES DE DATOS: ${totalPages}`);

    // Categorize by purpose
    console.log("\n\n📋 CATEGORIZACIÓN POR PROPÓSITO");
    console.log("=".repeat(70));

    const categories = {
        critical: databases.filter(db =>
            db.title.includes('SBD_SubCategoría') ||
            db.title.includes('BD_Eventos')
        ),
        repositories: databases.filter(db =>
            db.title.includes('Libros') ||
            db.title.includes('Videos') ||
            db.title.includes('Repositorio')
        ),
        complementary: databases.filter(db =>
            db.title.includes('Clases') ||
            db.title.includes('Correos') ||
            db.title.includes('ContextoIA')
        ),
        documentation: pages
    };

    console.log("\n⭐ CRÍTICAS (IDs de sincronización):");
    for (const db of categories.critical) {
        console.log(`   ${db.title}: ${db.pageCount} páginas`);
    }

    console.log("\n📚 REPOSITORIOS (Material académico/recursos):");
    for (const db of categories.repositories) {
        const note = db.title.includes('Repositorio') ? ' (Pregrado)' : '';
        console.log(`   ${db.title}: ${db.pageCount} páginas${note}`);
    }

    console.log("\n📦 COMPLEMENTARIAS:");
    for (const db of categories.complementary) {
        console.log(`   ${db.title}: ${db.pageCount} páginas`);
    }

    console.log("\n📄 DOCUMENTACIÓN:");
    for (const page of categories.documentation) {
        console.log(`   - ${page.title}`);
    }

    // Save report
    const report = {
        configPage: {
            id: CONFIG_PAGE_ID,
            title: configTitle
        },
        discovered: {
            databases: databases.map(d => ({
                title: d.title,
                id: d.id,
                pageCount: d.pageCount,
                depth: d.depth
            })),
            pages: pages.map(p => ({
                title: p.title,
                id: p.id,
                depth: p.depth
            }))
        },
        summary: {
            totalDatabases: databases.length,
            totalPages: totalPages,
            documentationPages: pages.length
        },
        categories
    };

    writeFileSync('config-complete-with-pagination.json', JSON.stringify(report, null, 2));
    console.log("\n\n💾 Análisis completo guardado en config-complete-with-pagination.json");

    return report;
}

analyzeConfigComplete().catch(console.error);

