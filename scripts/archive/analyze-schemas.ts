import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

async function getCorrectTasksDBId() {
    // Get from Config page
    const CONFIG_PAGE_ID = "1feaf5dbbe15805dbdf5efd47ff793e7";

    const blocks = await notion.blocks.children.list({
        block_id: CONFIG_PAGE_ID,
        page_size: 100
    });

    for (const block of blocks.results) {
        const b = block as any;
        if (b.type === 'child_database') {
            console.log(`Found DB: ${b.child_database?.title} - ID: ${b.id}`);
            return b.id;
        }
    }
    return null;
}

async function analyzeDBSchema(dbId: string, dbName: string) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📊 ${dbName} - SCHEMA ANALYSIS`);
    console.log("=".repeat(70));

    try {
        const db = await notion.databases.retrieve({ database_id: dbId });
        const props = (db as any).properties;

        console.log(`\nProperties:`);
        for (const [name, prop] of Object.entries(props)) {
            const p = prop as any;
            console.log(`   ${name} (${p.type})`);

            if (p.type === 'select' && p.select?.options) {
                console.log(`      Options: ${p.select.options.map((o: any) => o.name).join(', ')}`);
            } else if (p.type === 'multi_select' && p.multi_select?.options) {
                console.log(`      Options: ${p.multi_select.options.map((o: any) => o.name).join(', ')}`);
            }
        }

        // Get sample pages with all properties
        const pages = await notion.databases.query({
            database_id: dbId,
            page_size: 5
        });

        console.log(`\nSample Pages (${pages.results.length}):`);
        for (const page of pages.results) {
            const p = page as any;
            const pageProps = p.properties;

            let title = "Untitled";
            let tipo = "";
            let categoria = "";

            for (const [key, value] of Object.entries(pageProps)) {
                const prop = value as any;
                if (prop.type === 'title' && prop.title?.length > 0) {
                    title = prop.title[0].plain_text;
                } else if (key === 'Tipo' && prop.select) {
                    tipo = prop.select.name;
                } else if (key === 'Categoría' && prop.select) {
                    categoria = prop.select.name;
                }
            }

            console.log(`   ${p.icon?.emoji || "📄"} ${title}`);
            if (tipo) console.log(`      Tipo: ${tipo}`);
            if (categoria) console.log(`      Categoría: ${categoria}`);
        }

        return { schema: props, samplePages: pages.results };

    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log("🔍 DEEP SCHEMA ANALYSIS OF LEGACY DATABASES\n");

    const results: any = {};

    // Get correct Tareas DB ID
    console.log("Finding Tareas database...");
    const tareasId = await getCorrectTasksDBId();

    const databases = {
        "BD_Eventos": "2bbaf5dbbe1580c3b414fabd8093c688",
        "BD_Tareas": tareasId,
        "BD_SubCategorias": "214af5dbbe1580c098f3c5ce5b4c6b48",
        "BD_Areas": "1feaf5dbbe15802fa0d3e0e55b42a23f"
    };

    for (const [name, id] of Object.entries(databases)) {
        if (!id) {
            console.log(`\n⚠️  Skipping ${name} - ID not found`);
            continue;
        }

        results[name] = await analyzeDBSchema(id, name);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    writeFileSync('legacy-schemas-complete.json', JSON.stringify(results, null, 2));
    console.log("\n\n✅ Complete schemas saved to legacy-schemas-complete.json");
}

main().catch(console.error);

