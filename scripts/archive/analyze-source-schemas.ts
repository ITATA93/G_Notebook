import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

const DBS = {
    "BD_Libros": "64cd366b-5094-444e-bf55-2bb6e65225a5",
    "BD_Videos": "598e44a4-c24b-41ca-8d91-11923df13564",
    "Repositorio": "dd0b1cf9-151f-4b31-88b9-e53ad14d27a4"
};

async function analyzeSchemas() {
    console.log("🔍 ANALIZANDO ESQUEMAS DE BASES DE DATOS FUENTE\n");
    console.log("=".repeat(70));

    const schemas: any = {};

    for (const [name, id] of Object.entries(DBS)) {
        console.log(`\n📊 ${name}:`);

        const db = await notion.databases.retrieve({ database_id: id });
        const props = (db as any).properties;

        schemas[name] = {};

        for (const [propName, prop] of Object.entries(props)) {
            const p = prop as any;
            console.log(`   - ${propName} (${p.type})`);
            schemas[name][propName] = p.type;
        }
    }

    writeFileSync('source-schemas.json', JSON.stringify(schemas, null, 2));
    console.log("\n\n💾 Esquemas guardados en source-schemas.json");
}

analyzeSchemas().catch(console.error);

