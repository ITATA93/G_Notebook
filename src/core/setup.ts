import { Client } from "@notionhq/client";
import { readFileSync, writeFileSync } from "fs";
import { parse } from "yaml";
import { MANIFEST_PATH } from "../config.js";
import { retryWithBackoff, notionRateLimiter } from "../utils/helpers.js";

// Mapping helper (reused/simplified from deploy)
function mapProperties(propsConfig: Record<string, any>): Record<string, any> {
    const mapped: Record<string, any> = {};
    for (const [name, config] of Object.entries(propsConfig)) {
        if (config.type === 'title') {
            mapped[name] = { title: {} }; // Explicit title handling
        } else if (config.type === 'select') {
            mapped[name] = { select: { options: (config.options || []).map((o: string) => ({ name: o })) } };
        } else if (config.type === 'multi_select') {
            mapped[name] = { multi_select: { options: (config.options || []).map((o: string) => ({ name: o })) } };
        } else if (config.type === 'rollup') {
            // Rollups cannot be created directly via properties creation in the same step as relations usually
            // We usually exclude them in creation and update later, but let's try or skip
            console.log(`   ⚠️ Skipping Rollup '${name}' during creation (Update later)`);
            continue;
        } else {
            mapped[name] = { [config.type]: {} };
        }
    }
    return mapped;
}

export async function setupSystem(notionToken: string, parentPageId: string): Promise<void> {
    const notion = new Client({ auth: notionToken });
    const manifest = parse(readFileSync(MANIFEST_PATH, "utf-8"));

    console.log("🚀 INICIANDO INSTALACIÓN CORE_NOTION...");
    console.log(`   📍 Parent Page ID: ${parentPageId}`);

    const newDbIds: Record<string, string> = {};

    // 1. Create Databases
    for (const [dbKey, config] of Object.entries(manifest.databases)) {
        const dbConfig = config as any;
        console.log(`\n📦 Creando: ${dbConfig.title} (${dbConfig.icon})`);

        await retryWithBackoff(async () => {
            await notionRateLimiter.waitIfNeeded();

            const properties = mapProperties(dbConfig.properties);

            // Add Title property explicitly using the configured name
            properties[dbConfig.title_property_name] = { title: {} };

            const response = await notion.databases.create({
                parent: { page_id: parentPageId },
                title: [{ text: { content: dbConfig.title } }],
                icon: dbConfig.icon ? { emoji: dbConfig.icon } : undefined,
                properties: properties
            });

            newDbIds[dbKey] = response.id;
            console.log(`   ✅ Created! ID: ${response.id}`);
        });
    }

    // 2. Output IDs for Config
    console.log("\n⚠️ ATENCIÓN: Actualiza 'src/config.ts' con estos nuevos IDs:");
    console.log("---------------------------------------------------------");
    console.log("export const DB_IDS = {");
    for (const [key, id] of Object.entries(newDbIds)) {
        console.log(`    ${key}: "${id}",`);
    }
    console.log("};");
    console.log("---------------------------------------------------------");

    // Auto-update config.ts (Dangerous but requested "Auto")
    updateConfigFile(newDbIds);
}

function updateConfigFile(newIds: Record<string, string>) {
    const configPath = "w:/GIT/NOs/src/config.ts";
    let content = readFileSync(configPath, 'utf-8');

    // Regex replace or rebuild
    // Simple approach: Replace the inner part of DB_IDS object
    // Note: This is fragile if file structure changes. 
    // Let's just create a block to replace.

    const newBlockLines = Object.entries(newIds).map(([k, v]) => `    ${k}: "${v}",`);
    const newBlock = `export const DB_IDS = {\n${newBlockLines.join("\n")}\n} as const;`;

    // Replace the existing DB_IDS block (matches both 'as const' and type annotation versions)
    content = content.replace(/export const DB_IDS\s*(?::\s*Record<[^>]+>)?\s*=\s*\{[\s\S]*?\}\s*(?:as const)?;/, newBlock);

    writeFileSync(configPath, content);
    console.log("\n💾 'src/config.ts' has been auto-updated.");
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: tsx src/core/setup.ts <TOKEN> <PARENT_PAGE_ID>");
        process.exit(1);
    }
    setupSystem(args[0], args[1]).catch(console.error);
}
