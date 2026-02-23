import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

const LEGACY_DBS = {
    "BD_Categorias": "2bbaf5db-be15-80c3-b414-fabd8093c688",
    "SBD_Categoría": "214af5dbbe1580c098f3c5ce5b4c6b48",
    "SBD_SubCategoría": "1feaf5dbbe15802fa0d3e0e55b42a23f"
};

const CURRENT_DBS = {
    "DB_AREAS": "2d7af5db-be15-81e9-9630-e633d6cf9075",
    "DB_SUBCATEGORIES": "2d7af5db-be15-81ba-95d5-dde79aa4269b",
    "DB_PROJECTS": "2d7af5db-be15-8196-82b3-d75c37b2ee36"
};

interface Entry {
    title: string;
    source: string;
    id: string;
}

async function getAllEntries(dbId: string, dbName: string): Promise<Entry[]> {
    const pages = await notion.databases.query({
        database_id: dbId,
        page_size: 100
    });

    const entries: Entry[] = [];

    for (const page of pages.results) {
        const p = page as any;
        const props = p.properties;

        let title = "Untitled";
        for (const [key, value] of Object.entries(props)) {
            const prop = value as any;
            if (prop.type === 'title' && prop.title?.length > 0) {
                title = prop.title[0].plain_text;
                break;
            }
        }

        entries.push({
            title: title.trim(),
            source: dbName,
            id: p.id
        });
    }

    return entries;
}

async function main() {
    console.log("🔍 MAPEANDO TODAS LAS ENTRADAS (LEGACY + ACTUAL)\n");

    const allEntries: Entry[] = [];

    // Get legacy entries
    console.log("📦 Extrayendo entradas LEGACY...\n");
    for (const [name, id] of Object.entries(LEGACY_DBS)) {
        const entries = await getAllEntries(id, name);
        allEntries.push(...entries);
        console.log(`   ${name}: ${entries.length} entradas`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Get current entries
    console.log("\n✨ Extrayendo entradas ACTUALES...\n");
    for (const [name, id] of Object.entries(CURRENT_DBS)) {
        const entries = await getAllEntries(id, name);
        allEntries.push(...entries);
        console.log(`   ${name}: ${entries.length} entradas`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n📊 Total de entradas: ${allEntries.length}`);

    // Find duplicates
    console.log("\n\n🔍 BUSCANDO DUPLICADOS...\n");
    console.log("=".repeat(70));

    const titleMap: Map<string, Entry[]> = new Map();

    for (const entry of allEntries) {
        const normalized = entry.title.toLowerCase().trim();
        if (!titleMap.has(normalized)) {
            titleMap.set(normalized, []);
        }
        titleMap.get(normalized)!.push(entry);
    }

    const duplicates: Array<{ title: string, entries: Entry[] }> = [];

    for (const [title, entries] of titleMap.entries()) {
        if (entries.length > 1) {
            duplicates.push({ title, entries });
        }
    }

    if (duplicates.length === 0) {
        console.log("✅ NO SE ENCONTRARON DUPLICADOS");
    } else {
        console.log(`⚠️  ENCONTRADOS ${duplicates.length} TÍTULOS DUPLICADOS:\n`);

        for (const dup of duplicates) {
            console.log(`\n📌 "${dup.title}" (${dup.entries.length} veces):`);
            for (const entry of dup.entries) {
                console.log(`   - ${entry.source}`);
            }
        }
    }

    // Generate migration mapping
    console.log("\n\n📋 MAPEO DE MIGRACIÓN");
    console.log("=".repeat(70));

    const migrationMap: any = {
        duplicates: duplicates.map(d => ({
            title: d.title,
            count: d.entries.length,
            sources: d.entries.map(e => e.source)
        })),
        legacy: {
            "BD_Categorias": [],
            "SBD_Categoría": [],
            "SBD_SubCategoría": []
        },
        current: {
            "DB_AREAS": [],
            "DB_SUBCATEGORIES": [],
            "DB_PROJECTS": []
        }
    };

    for (const entry of allEntries) {
        if (entry.source in migrationMap.legacy) {
            migrationMap.legacy[entry.source].push(entry.title);
        } else if (entry.source in migrationMap.current) {
            migrationMap.current[entry.source].push(entry.title);
        }
    }

    // Check overlap
    console.log("\n🔄 ANÁLISIS DE SOLAPAMIENTO:\n");

    const legacyTitles = new Set<string>();
    for (const [db, titles] of Object.entries(migrationMap.legacy)) {
        for (const title of titles as string[]) {
            legacyTitles.add(title.toLowerCase().trim());
        }
    }

    const currentTitles = new Set<string>();
    for (const [db, titles] of Object.entries(migrationMap.current)) {
        for (const title of titles as string[]) {
            currentTitles.add(title.toLowerCase().trim());
        }
    }

    const overlap: string[] = [];
    for (const title of legacyTitles) {
        if (currentTitles.has(title)) {
            overlap.push(title);
        }
    }

    console.log(`Legacy único: ${legacyTitles.size - overlap.length}`);
    console.log(`Actual único: ${currentTitles.size - overlap.length}`);
    console.log(`Solapamiento: ${overlap.length}`);

    if (overlap.length > 0) {
        console.log(`\n⚠️  ENTRADAS QUE YA EXISTEN EN SISTEMA ACTUAL:`);
        for (const title of overlap.slice(0, 20)) {
            console.log(`   - ${title}`);
        }
        if (overlap.length > 20) {
            console.log(`   ... y ${overlap.length - 20} más`);
        }
    }

    // Save report
    const report = {
        summary: {
            totalEntries: allEntries.length,
            legacyCount: legacyTitles.size,
            currentCount: currentTitles.size,
            duplicatesCount: duplicates.length,
            overlapCount: overlap.length
        },
        duplicates,
        overlap,
        migrationMap
    };

    writeFileSync('migration-mapping-report.json', JSON.stringify(report, null, 2));
    console.log("\n\n💾 Reporte completo guardado en migration-mapping-report.json");

    // Recommendations
    console.log("\n\n💡 RECOMENDACIONES:");
    console.log("=".repeat(70));

    if (overlap.length > 0) {
        console.log(`\n⚠️  HAY ${overlap.length} ENTRADAS DUPLICADAS`);
        console.log("\nOpciones:");
        console.log("1. SKIP: No migrar las que ya existen");
        console.log("2. MERGE: Combinar información de ambas");
        console.log("3. REPLACE: Reemplazar con datos legacy");
    } else {
        console.log("\n✅ No hay solapamiento. Migración segura.");
    }
}

main().catch(console.error);

