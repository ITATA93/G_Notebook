import { Client } from "@notionhq/client";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

const DB_MASTER_TASKS = "2d7af5db-be15-8127-8d03-c72f11529b00";

async function checkTasksSchema() {
    console.log("🔍 VERIFICANDO ESQUEMA DE DB_MASTER_TASKS\n");

    const db = await notion.databases.retrieve({ database_id: DB_MASTER_TASKS });
    const props = (db as any).properties;

    console.log("Propiedades disponibles:");
    for (const [name, prop] of Object.entries(props)) {
        const p = prop as any;
        console.log(`   - ${name} (${p.type})`);
    }
}

checkTasksSchema().catch(console.error);

