import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

// Legacy database IDs from URLs
const LEGACY_DBS = {
    categorias: "2bbaf5dbbe1580c3b414fabd8093c688",
    subcategorias: "214af5dbbe1580c098f3c5ce5b4c6b48",
    areas: "1feaf5dbbe15802fa0d3e0e55b42a23f"
};

interface ExtractedItem {
    name: string;
    icon?: string;
    description?: string;
    calendarId?: string;
    taskListId?: string;
    parent?: string;
    type?: string;
}

async function extractDatabase(dbId: string, dbName: string): Promise<ExtractedItem[]> {
    console.log(`\n📦 Extrayendo: ${dbName}`);
    const items: ExtractedItem[] = [];

    try {
        const response = await notion.databases.query({
            database_id: dbId,
            page_size: 100
        });

        console.log(`   ✅ Encontradas ${response.results.length} páginas`);

        for (const page of response.results) {
            if (page.object !== 'page') continue;

            const props = (page as any).properties;
            const item: ExtractedItem = {
                name: "",
                icon: (page as any).icon?.emoji
            };

            // Extract title (could be "Nombre", "Name", "Categoría", etc.)
            for (const [key, value] of Object.entries(props)) {
                const prop = value as any;

                if (prop.type === 'title' && prop.title?.length > 0) {
                    item.name = prop.title[0].plain_text;
                }
                else if (key === 'Descripción' && prop.rich_text?.length > 0) {
                    item.description = prop.rich_text[0].plain_text;
                }
                else if (key === 'Billing Calendar ID' || key === 'ID Calendario Facturación') {
                    item.calendarId = prop.rich_text?.[0]?.plain_text;
                }
                else if (key === 'Billing TaskList ID' || key === 'ID Lista Tareas') {
                    item.taskListId = prop.rich_text?.[0]?.plain_text;
                }
                else if (key === 'Categoría' && prop.select) {
                    item.type = prop.select.name;
                }
                else if (key === 'Área KLA' || key === 'Parent' && prop.relation?.length > 0) {
                    // We'll need to resolve this later
                    item.parent = prop.relation[0].id;
                }
            }

            if (item.name) {
                items.push(item);
                console.log(`      - ${item.icon || '📄'} ${item.name}`);
            }
        }
    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
    }

    return items;
}

async function main() {
    const allData: Record<string, ExtractedItem[]> = {};

    for (const [name, id] of Object.entries(LEGACY_DBS)) {
        allData[name] = await extractDatabase(id, name);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save to file
    const output = JSON.stringify(allData, null, 2);
    writeFileSync('legacy-data.json', output);
    console.log('\n✅ Datos guardados en legacy-data.json');

    // Print summary
    console.log('\n📊 RESUMEN:');
    for (const [name, items] of Object.entries(allData)) {
        console.log(`   ${name}: ${items.length} items`);
    }
}

main().catch(console.error);

