import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const CONFIG_PAGE_ID = "1feaf5dbbe15805dbdf5efd47ff793e7";

const notion = new Client({ auth: TOKEN });

interface DiscoveredItem {
    type: 'database' | 'page';
    id: string;
    title: string;
    pageCount?: number;
    depth: number;
}

async function exploreRecursive(blockId: string, depth: number = 0, discovered: DiscoveredItem[] = []): Promise<DiscoveredItem[]> {
    const indent = "  ".repeat(depth);

    try {
        const blocks = await notion.blocks.children.list({
            block_id: blockId,
            page_size: 100
        });

        for (const block of blocks.results) {
            const b = block as any;

            if (b.type === 'child_database') {
                const dbTitle = b.child_database?.title || "Untitled DB";
                console.log(`${indent}🗄️  ${dbTitle} (ID: ${b.id})`);

                try {
                    const pages = await notion.databases.query({
                        database_id: b.id,
                        page_size: 1
                    });

                    const fullQuery = await notion.databases.query({
                        database_id: b.id,
                        page_size: 100
                    });

                    console.log(`${indent}   📊 ${fullQuery.results.length} páginas`);

                    discovered.push({
                        type: 'database',
                        id: b.id,
                        title: dbTitle,
                        pageCount: fullQuery.results.length,
                        depth
                    });
                } catch (error: any) {
                    console.log(`${indent}   ⚠️ No se pudo acceder: ${error.message}`);
                }

                await new Promise(resolve => setTimeout(resolve, 500));

            } else if (b.type === 'child_page') {
                const pageTitle = b.child_page?.title || "Untitled Page";
                console.log(`${indent}📄 ${pageTitle} (ID: ${b.id})`);

                discovered.push({
                    type: 'page',
                    id: b.id,
                    title: pageTitle,
                    depth
                });

                // Explorar recursivamente
                await new Promise(resolve => setTimeout(resolve, 300));
                await exploreRecursive(b.id, depth + 1, discovered);
            }
        }
    } catch (error: any) {
        console.log(`${indent}⚠️ Error explorando: ${error.message}`);
    }

    return discovered;
}

async function analyzeConfigComplete() {
    console.log("🔍 ANÁLISIS COMPLETO DE CONFIG PAGE\n");
    console.log("=".repeat(70));

    // Get Config page info
    const configPage = await notion.pages.retrieve({ page_id: CONFIG_PAGE_ID }) as any;
    const configTitle = configPage.properties.title?.title?.[0]?.plain_text || "Config";

    console.log(`\n📄 Página Raíz: ${configTitle}`);
    console.log(`   ID: ${CONFIG_PAGE_ID}\n`);

    // Explore recursively
    const discovered = await exploreRecursive(CONFIG_PAGE_ID);

    // Summary
    console.log("\n\n📊 RESUMEN DE DESCUBRIMIENTO");
    console.log("=".repeat(70));

    const databases = discovered.filter(d => d.type === 'database');
    const pages = discovered.filter(d => d.type === 'page');

    console.log(`\n🗄️  Bases de Datos: ${databases.length}`);
    for (const db of databases) {
        console.log(`   - ${db.title} (${db.pageCount} páginas)`);
    }

    console.log(`\n📄 Páginas: ${pages.length}`);
    for (const page of pages) {
        console.log(`   - ${page.title}`);
    }

    // Identify important databases
    console.log("\n\n⭐ BASES DE DATOS IMPORTANTES PARA MIGRAR");
    console.log("=".repeat(70));

    const important = databases.filter(db =>
        db.pageCount && db.pageCount > 0 &&
        (db.title.includes('Libros') ||
            db.title.includes('Videos') ||
            db.title.includes('Tareas') ||
            db.title.includes('Eventos'))
    );

    for (const db of important) {
        console.log(`\n📚 ${db.title}`);
        console.log(`   Páginas: ${db.pageCount}`);
        console.log(`   ID: ${db.id}`);
        console.log(`   Acción: MIGRAR a Core_Notion`);
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
            totalPages: pages.length,
            databasesWithContent: databases.filter(d => d.pageCount && d.pageCount > 0).length
        }
    };

    writeFileSync('config-complete-analysis.json', JSON.stringify(report, null, 2));
    console.log("\n\n💾 Análisis completo guardado en config-complete-analysis.json");

    return report;
}

analyzeConfigComplete().catch(console.error);

