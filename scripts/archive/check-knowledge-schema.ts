import { Client } from "@notionhq/client";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });
const DB_KNOWLEDGE_BASE = "2d7af5db-be15-8130-aa16-ff4dd56adb1c";

async function checkKnowledgeBaseSchema() {
    console.log("🔍 VERIFICANDO ESQUEMA DE DB_KNOWLEDGE_BASE\n");
    console.log("=".repeat(70));

    const db = await notion.databases.retrieve({ database_id: DB_KNOWLEDGE_BASE });
    const props = (db as any).properties;

    console.log("\nPropiedades actuales:");
    for (const [name, prop] of Object.entries(props)) {
        const p = prop as any;
        console.log(`   - ${name} (${p.type})`);
    }

    // Check for missing critical properties
    const required = [
        { name: "Autor", type: "rich_text" },
        { name: "Año", type: "number" },
        { name: "ISBN", type: "rich_text" },
        { name: "Descripción", type: "rich_text" },
        { name: "URL", type: "url" },
        { name: "Archivo", type: "files" },
        { name: "Portada", type: "files" },
        { name: "Especialidad", type: "select" },
        { name: "Institución", type: "select" },
        { name: "Tema", type: "multi_select" }
    ];

    console.log("\n\n📋 PROPIEDADES REQUERIDAS:");
    console.log("=".repeat(70));

    const missing: any[] = [];

    for (const req of required) {
        if (props[req.name]) {
            console.log(`✅ ${req.name} (${props[req.name].type})`);
        } else {
            console.log(`❌ ${req.name} (${req.type}) - FALTA`);
            missing.push(req);
        }
    }

    if (missing.length > 0) {
        console.log(`\n\n⚠️ FALTAN ${missing.length} PROPIEDADES CRÍTICAS`);
        console.log("\nNecesitas agregar estas propiedades a DB_KNOWLEDGE_BASE:");
        for (const prop of missing) {
            console.log(`   - ${prop.name} (${prop.type})`);
        }
    } else {
        console.log("\n\n✅ Todas las propiedades requeridas están presentes");
    }
}

checkKnowledgeBaseSchema().catch(console.error);

