import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

const BD_PAGINAS_ID = "2bbaf5db-be15-8166-b260-d0ae147b8525";

async function analyzeBDPaginas() {
    console.log("🔍 ANALIZANDO BD_PAGINAS (Frontend Pages)\n");
    console.log("=".repeat(70));

    // Get schema
    const db = await notion.databases.retrieve({ database_id: BD_PAGINAS_ID });
    const props = (db as any).properties;

    console.log("\nPropiedades:");
    for (const [name, prop] of Object.entries(props)) {
        const p = prop as any;
        console.log(`   ${name} (${p.type})`);
    }

    // Get all pages
    const pages = await notion.databases.query({
        database_id: BD_PAGINAS_ID,
        page_size: 100
    });

    console.log(`\n📊 Total de páginas: ${pages.results.length}\n`);

    const pageData: any[] = [];
    const proyectosRelacionados = new Set<string>();

    for (const page of pages.results) {
        const p = page as any;
        const pageProps = p.properties;

        let nombre = "Untitled";
        let objetivoGeneral = "";
        let objetivoEspecifico = "";
        let proyectoRelacionado = "";
        let paginaMadre = "";

        for (const [key, value] of Object.entries(pageProps)) {
            const prop = value as any;

            if (prop.type === 'title' && prop.title?.length > 0) {
                nombre = prop.title[0].plain_text;
            } else if (key === 'Objetivo General' && prop.rich_text?.length > 0) {
                objetivoGeneral = prop.rich_text[0].plain_text;
            } else if (key === 'Objetivo Específico' && prop.rich_text?.length > 0) {
                objetivoEspecifico = prop.rich_text[0].plain_text;
            } else if (key === 'Proyecto Relacionado' && prop.relation?.length > 0) {
                proyectoRelacionado = `${prop.relation.length} links`;
                // Get actual project names if possible
                for (const rel of prop.relation) {
                    proyectosRelacionados.add(rel.id);
                }
            } else if (key === 'Página Madre' && prop.relation?.length > 0) {
                paginaMadre = `${prop.relation.length} links`;
            }
        }

        pageData.push({
            nombre,
            objetivoGeneral,
            objetivoEspecifico,
            proyectoRelacionado,
            paginaMadre
        });

        console.log(`📄 ${nombre}`);
        if (objetivoGeneral) {
            console.log(`   Objetivo: ${objetivoGeneral.substring(0, 80)}...`);
        }
        if (proyectoRelacionado) {
            console.log(`   Proyecto: ${proyectoRelacionado}`);
        }
    }

    // Analyze structure
    console.log("\n\n📋 ANÁLISIS DE ESTRUCTURA");
    console.log("=".repeat(70));

    const categorias = new Set<string>();

    // Extract potential categories from page names
    for (const page of pageData) {
        const nombre = page.nombre.toLowerCase();

        // Common patterns
        if (nombre.includes('magister') || nombre.includes('epidemio')) {
            categorias.add('Magister Epidemiología');
        } else if (nombre.includes('hospital') || nombre.includes('urgencia')) {
            categorias.add('Hospital');
        } else if (nombre.includes('finanza') || nombre.includes('gasto')) {
            categorias.add('Finanzas');
        } else if (nombre.includes('docencia') || nombre.includes('clase')) {
            categorias.add('Docencia');
        } else if (nombre.includes('investigacion') || nombre.includes('paper')) {
            categorias.add('Investigación');
        } else if (nombre.includes('personal') || nombre.includes('salud')) {
            categorias.add('Personal');
        }
    }

    console.log("\n🏷️  Categorías inferidas de BD_Paginas:");
    for (const cat of categorias) {
        console.log(`   - ${cat}`);
    }

    console.log(`\n📊 Proyectos relacionados únicos: ${proyectosRelacionados.size}`);

    // Save report
    const report = {
        totalPages: pages.results.length,
        pages: pageData,
        inferredCategories: Array.from(categorias),
        uniqueProjects: proyectosRelacionados.size
    };

    writeFileSync('bd-paginas-analysis.json', JSON.stringify(report, null, 2));
    console.log("\n💾 Análisis guardado en bd-paginas-analysis.json");

    // Recommendations
    console.log("\n\n💡 RECOMENDACIONES:");
    console.log("=".repeat(70));
    console.log("\nBD_Paginas muestra la estructura de frontend que usabas.");
    console.log("Esto sugiere que necesitas:");
    console.log("1. Verificar que todas las categorías inferidas existan en DB_AREAS");
    console.log("2. Confirmar que los proyectos relacionados estén en DB_PROJECTS");
    console.log("3. Considerar si necesitas una DB para 'Páginas Frontend' en el nuevo sistema");
}

analyzeBDPaginas().catch(console.error);

