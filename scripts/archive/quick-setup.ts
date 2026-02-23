import { Client } from "@notionhq/client";

const TOKEN = process.argv[2];
const PAGE_ID = process.argv[3];

if (!TOKEN || !PAGE_ID) {
    console.error("❌ Usage: tsx quick-setup.ts <TOKEN> <PAGE_ID>");
    process.exit(1);
}

console.log("🚀 INICIANDO INSTALACIÓN LIMPIA...");
console.log(`📍 Token: ${TOKEN.substring(0, 10)}...`);
console.log(`📍 Page ID: ${PAGE_ID}`);

const notion = new Client({ auth: TOKEN });

const databases = [
    { key: "DB_AREAS", title: "Áreas Maestras", icon: "🏛️" },
    { key: "DB_PROJECTS", title: "Proyectos Activos", icon: "🚀" },
    { key: "DB_MASTER_TASKS", title: "Tareas Maestras", icon: "✅" },
    { key: "DB_KNOWLEDGE_BASE", title: "Base de Conocimiento", icon: "🧠" },
    { key: "DB_ENTITIES_ASSETS", title: "Activos & Entidades", icon: "🏛️" },
    { key: "DB_FINANCE_LEDGER", title: "Finanzas & Gastos", icon: "💰" },
    { key: "DB_SURGICAL_LOG", title: "Registro Quirúrgico", icon: "😷" },
    { key: "DB_METRICS_LOG", title: "Métricas & Journal", icon: "📓" },
    { key: "DB_CANVAS_COURSES", title: "Cursos Canvas", icon: "🎓" },
    { key: "DB_EMAILS", title: "Bandeja de Entrada", icon: "📧" },
    { key: "DB_MEETINGS_CLASSES", title: "Reuniones & Eventos", icon: "📅" }
];

async function createDatabase(key: string, title: string, icon: string) {
    try {
        console.log(`\n📦 Creando: ${title} ${icon}`);
        const response = await notion.databases.create({
            parent: { page_id: PAGE_ID },
            title: [{ text: { content: title } }],
            icon: { emoji: icon },
            properties: {
                "Nombre": { title: {} }
            }
        });
        console.log(`   ✅ ID: ${response.id}`);
        return { key, id: response.id };
    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    const results = [];

    for (const db of databases) {
        const result = await createDatabase(db.key, db.title, db.icon);
        if (result) results.push(result);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("\n\n📋 RESULTADOS:");
    console.log("export const DB_IDS = {");
    for (const r of results) {
        console.log(`    ${r.key}: "${r.id}",`);
    }
    console.log("} as const;");
}

main().catch(console.error);
