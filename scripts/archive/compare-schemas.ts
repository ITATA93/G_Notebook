import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

const DATABASES = {
    "BD_Categorias": "2bbaf5db-be15-80c3-b414-fabd8093c688",
    "SBD_Categoría": "214af5dbbe1580c098f3c5ce5b4c6b48",
    "SBD_SubCategoría": "1feaf5dbbe15802fa0d3e0e55b42a23f",
    "DB_AREAS": "2d7af5db-be15-81e9-9630-e633d6cf9075"
};

async function compareSchemas() {
    console.log("🔍 COMPARANDO ESQUEMAS Y DATOS\n");

    const comparison: any = {};

    for (const [name, id] of Object.entries(DATABASES)) {
        console.log(`\n${"=".repeat(70)}`);
        console.log(`📊 ${name}`);
        console.log("=".repeat(70));

        // Get schema
        const db = await notion.databases.retrieve({ database_id: id });
        const props = (db as any).properties;

        console.log(`\nPropiedades (${Object.keys(props).length}):`);
        for (const [propName, prop] of Object.entries(props)) {
            const p = prop as any;
            console.log(`   ${propName} (${p.type})`);
        }

        // Get sample page with all data
        const pages = await notion.databases.query({
            database_id: id,
            page_size: 3
        });

        console.log(`\nMuestra de datos (${pages.results.length} páginas):`);

        for (const page of pages.results) {
            const p = page as any;
            const pageProps = p.properties;

            let title = "Untitled";
            const filledProps: string[] = [];

            for (const [key, value] of Object.entries(pageProps)) {
                const prop = value as any;

                if (prop.type === 'title' && prop.title?.length > 0) {
                    title = prop.title[0].plain_text;
                } else if (prop.type === 'rich_text' && prop.rich_text?.length > 0) {
                    filledProps.push(`${key}: "${prop.rich_text[0].plain_text.substring(0, 50)}..."`);
                } else if (prop.type === 'select' && prop.select) {
                    filledProps.push(`${key}: ${prop.select.name}`);
                } else if (prop.type === 'relation' && prop.relation?.length > 0) {
                    filledProps.push(`${key}: ${prop.relation.length} links`);
                } else if (prop.type === 'date' && prop.date) {
                    filledProps.push(`${key}: ${prop.date.start}`);
                }
            }

            console.log(`\n   📄 ${title}`);
            if (filledProps.length > 0) {
                for (const fp of filledProps) {
                    console.log(`      ${fp}`);
                }
            } else {
                console.log(`      (sin datos adicionales)`);
            }
        }

        comparison[name] = {
            propertyCount: Object.keys(props).length,
            properties: Object.keys(props),
            pageCount: pages.results.length
        };

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Compare
    console.log("\n\n📋 COMPARACIÓN DE PROPIEDADES");
    console.log("=".repeat(70));

    const bdCatProps = new Set(comparison["BD_Categorias"].properties);
    const sbdCatProps = new Set(comparison["SBD_Categoría"].properties);
    const sbdSubProps = new Set(comparison["SBD_SubCategoría"].properties);
    const dbAreasProps = new Set(comparison["DB_AREAS"].properties);

    console.log("\n🔍 BD_Categorias vs SBD_Categoría:");
    const bdExtra = [...bdCatProps].filter(p => !sbdCatProps.has(p));
    const sbdExtra = [...sbdCatProps].filter(p => !bdCatProps.has(p));

    if (bdExtra.length > 0) {
        console.log(`   BD_Categorias tiene EXTRA: ${bdExtra.join(', ')}`);
    }
    if (sbdExtra.length > 0) {
        console.log(`   SBD_Categoría tiene EXTRA: ${sbdExtra.join(', ')}`);
    }

    console.log("\n🔍 SBD_SubCategoría vs DB_AREAS:");
    const subExtra = [...sbdSubProps].filter(p => !dbAreasProps.has(p));
    const areasExtra = [...dbAreasProps].filter(p => !sbdSubProps.has(p));

    if (subExtra.length > 0) {
        console.log(`   SBD_SubCategoría tiene EXTRA: ${subExtra.join(', ')}`);
    }
    if (areasExtra.length > 0) {
        console.log(`   DB_AREAS tiene EXTRA: ${areasExtra.join(', ')}`);
    }

    console.log("\n\n💡 RECOMENDACIONES DE FUSIÓN:");
    console.log("=".repeat(70));

    if (subExtra.length > 0) {
        console.log(`\n⭐ SBD_SubCategoría tiene ${subExtra.length} propiedades únicas:`);
        for (const prop of subExtra) {
            console.log(`   - ${prop} → Agregar a DB_PROJECTS/SUBCATEGORIES`);
        }
    }

    writeFileSync('schema-comparison-report.json', JSON.stringify(comparison, null, 2));
    console.log("\n\n💾 Reporte guardado en schema-comparison-report.json");
}

compareSchemas().catch(console.error);

