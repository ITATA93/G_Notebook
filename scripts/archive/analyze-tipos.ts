import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

// IDs from the URLs you provided earlier
const LEGACY_DBS = {
    eventos: "2bbaf5dbbe1580c3b414fabd8093c688", // BD_Eventos
    tareas: "2ccaf5dbbe158055-89ef-c9cb0e1f2197", // From Config page
    // We'll also check the other databases
    subcategorias: "214af5dbbe1580c098f3c5ce5b4c6b48",
    areas: "1feaf5dbbe15802fa0d3e0e55b42a23f"
};

interface ItemWithType {
    id: string;
    title: string;
    tipo?: string;
    categoria?: string;
    area?: string;
    otherProps: Record<string, any>;
}

async function analyzeDatabaseTypes(dbId: string, dbName: string): Promise<ItemWithType[]> {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`📊 ${dbName.toUpperCase()}`);
    console.log("=".repeat(70));

    try {
        const response = await notion.databases.query({
            database_id: dbId,
            page_size: 100
        });

        console.log(`Found ${response.results.length} items\n`);

        const items: ItemWithType[] = [];
        const typeDistribution: Record<string, number> = {};

        for (const page of response.results) {
            if (page.object !== 'page') continue;

            const props = (page as any).properties;
            const item: ItemWithType = {
                id: page.id,
                title: "",
                otherProps: {}
            };

            // Extract all properties
            for (const [key, value] of Object.entries(props)) {
                const prop = value as any;

                if (prop.type === 'title' && prop.title?.length > 0) {
                    item.title = prop.title[0].plain_text;
                }
                else if (key === 'Tipo' && prop.select) {
                    item.tipo = prop.select.name;
                    typeDistribution[prop.select.name] = (typeDistribution[prop.select.name] || 0) + 1;
                }
                else if (key === 'Categoría' && prop.select) {
                    item.categoria = prop.select.name;
                }
                else if (key === 'Área' || key === 'Area' && prop.select) {
                    item.area = prop.select.name;
                }
                else if (key === 'Área KLA' && prop.relation?.length > 0) {
                    item.otherProps['area_relation'] = prop.relation.length;
                }
                else if (prop.type === 'select' && prop.select) {
                    item.otherProps[key] = prop.select.name;
                }
                else if (prop.type === 'multi_select' && prop.multi_select?.length > 0) {
                    item.otherProps[key] = prop.multi_select.map((s: any) => s.name).join(', ');
                }
            }

            items.push(item);

            // Print item
            const typeLabel = item.tipo ? `[${item.tipo}]` : "";
            const catLabel = item.categoria ? `{${item.categoria}}` : "";
            const areaLabel = item.area ? `<${item.area}>` : "";

            console.log(`   ${typeLabel} ${catLabel} ${areaLabel} ${item.title}`);
        }

        // Print type distribution
        if (Object.keys(typeDistribution).length > 0) {
            console.log(`\n📊 Distribution by Tipo:`);
            for (const [tipo, count] of Object.entries(typeDistribution).sort((a, b) => b[1] - a[1])) {
                console.log(`   ${tipo}: ${count} items`);
            }
        }

        return items;

    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return [];
    }
}

async function main() {
    console.log("🔍 ANALYZING LEGACY DATABASES FOR 'TIPO' PROPERTY\n");

    const allData: Record<string, ItemWithType[]> = {};

    for (const [name, id] of Object.entries(LEGACY_DBS)) {
        allData[name] = await analyzeDatabaseTypes(id, name);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save results
    writeFileSync('legacy-tipos-analysis.json', JSON.stringify(allData, null, 2));
    console.log("\n✅ Analysis saved to legacy-tipos-analysis.json");

    // Generate migration mapping
    console.log("\n\n📋 MIGRATION MAPPING RECOMMENDATIONS");
    console.log("=".repeat(70));

    for (const [dbName, items] of Object.entries(allData)) {
        if (items.length === 0) continue;

        console.log(`\n${dbName.toUpperCase()}:`);

        // Group by tipo
        const byTipo: Record<string, ItemWithType[]> = {};
        for (const item of items) {
            const tipo = item.tipo || item.categoria || "Sin clasificar";
            if (!byTipo[tipo]) byTipo[tipo] = [];
            byTipo[tipo].push(item);
        }

        for (const [tipo, tipoItems] of Object.entries(byTipo)) {
            const targetDB = suggestTargetDB(tipo, tipoItems[0]);
            console.log(`   ${tipo} (${tipoItems.length} items) → ${targetDB}`);
        }
    }
}

function suggestTargetDB(tipo: string, sample: ItemWithType): string {
    const t = tipo.toLowerCase();

    // Events/Meetings
    if (t.includes('evento') || t.includes('reunión') || t.includes('clase') || t.includes('turno')) {
        return "DB_MEETINGS_CLASSES 📅";
    }

    // Tasks
    if (t.includes('tarea') || t.includes('pendiente') || t.includes('acción')) {
        return "DB_MASTER_TASKS ✅";
    }

    // Projects
    if (t.includes('proyecto')) {
        return "DB_PROJECTS 🚀";
    }

    // Subcategories
    if (t.includes('área') || t.includes('categoría')) {
        return "DB_SUBCATEGORIES 📂";
    }

    return "DB_SUBCATEGORIES 📂 (default)";
}

main().catch(console.error);

