/**
 * Core deployment script for NOs system
 * Handles property updates and relation creation
 */

import { Client } from "@notionhq/client";
import { readFileSync } from "fs";
import { parse } from "yaml";
import { DB_IDS, MANIFEST_PATH, DatabaseKey } from "../config.js";
import { retryWithBackoff, notionRateLimiter } from "../utils/helpers.js";

type DeployOptions = {
    dryRun?: boolean;
};

interface PropertyConfig {
    type: string;
    options?: string[];
    format?: string;
}

interface DatabaseConfig {
    title: string;
    icon?: string;
    title_property_name: string;
    properties: Record<string, PropertyConfig>;
    relations_to_add_later?: Array<{
        name: string;
        target: string;
        dual_name_in_target: string;
    }>;
}

interface Manifest {
    databases: Record<string, DatabaseConfig>;
}

/**
 * Map manifest properties to Notion API format
 */
function mapProperties(propsConfig: Record<string, PropertyConfig>): Record<string, any> {
    const mapped: Record<string, any> = {};

    for (const [name, config] of Object.entries(propsConfig)) {
        const { type } = config;

        switch (type) {
            case "select":
                mapped[name] = {
                    select: {
                        options: (config.options || []).map(opt => ({ name: opt, color: "default" }))
                    }
                };
                break;
            case "multi_select":
                mapped[name] = {
                    multi_select: {
                        options: (config.options || []).map(opt => ({ name: opt, color: "default" }))
                    }
                };
                break;
            case "date":
                mapped[name] = { date: {} };
                break;
            case "checkbox":
                mapped[name] = { checkbox: {} };
                break;
            case "number":
                mapped[name] = { number: {} };
                break;
            case "url":
                mapped[name] = { url: {} };
                break;
            case "files":
                mapped[name] = { files: {} };
                break;
            case "rich_text":
                mapped[name] = { rich_text: {} };
                break;
            case "email":
                mapped[name] = { email: {} };
                break;
            case "phone_number":
                mapped[name] = { phone_number: {} };
                break;
            case "rollup":
                // Rollups cannot be created in the same pass; skip here (handled later manually)
                break;
        }
    }

    return mapped;
}

/**
 * Update database properties
 */
async function updateDbProperties(notion: Client, manifest: Manifest, options: DeployOptions): Promise<void> {
    const { dryRun = false } = options;
    console.log("\n🔧 ACTUALIZANDO PROPIEDADES");

    for (const [dbKey, dbId] of Object.entries(DB_IDS)) {
        if (!(dbKey in manifest.databases)) continue;

        const dbConfig = manifest.databases[dbKey];
        console.log(`   • ${dbKey} -> ${dbConfig.title}`);

        if (dryRun) {
            console.log(`      DRY-RUN: actualizaría título, icono y ${Object.keys(dbConfig.properties).length} propiedades`);
            continue;
        }

        await retryWithBackoff(async () => {
            await notionRateLimiter.waitIfNeeded();

            // 1. Retrieve Current DB Schema
            const db = await notion.databases.retrieve({ database_id: dbId });
            const currentProps = (db as any).properties;

            // 2. Rename Title Property if needed (e.g. "Name" -> "Nombre")
            const currentTitleProp = Object.values(currentProps).find((p: any) => p.type === "title") as any;
            if (currentTitleProp && currentTitleProp.name !== dbConfig.title_property_name) {
                console.log(`      ↺ Renombrando título: ${currentTitleProp.name} -> ${dbConfig.title_property_name}`);
                await notion.databases.update({
                    database_id: dbId,
                    properties: {
                        [currentTitleProp.name]: { name: dbConfig.title_property_name }
                    }
                });
            }

            // 3. Prepare Other Properties (Create/Update)
            const properties = mapProperties(dbConfig.properties);

            await notionRateLimiter.waitIfNeeded();

            // 4. Update Database Metadata (Title, Icon) and Properties
            console.log(`      ✅ Metadata: ${dbConfig.title} ${dbConfig.icon || ""}`);
            await notion.databases.update({
                database_id: dbId,
                title: [{ text: { content: dbConfig.title } }],
                icon: dbConfig.icon ? { emoji: dbConfig.icon as any } : undefined,
                properties: properties
            });

            console.log(`      Listo`);
        });
    }
}

/**
 * Create relations between databases
 */
async function createRelations(notion: Client, manifest: Manifest, options: DeployOptions): Promise<void> {
    const { dryRun = false } = options;
    console.log("\n🔗 CREANDO RELACIONES");

    for (const [dbKey, dbId] of Object.entries(DB_IDS)) {
        if (!(dbKey in manifest.databases)) continue;

        const relations = manifest.databases[dbKey].relations_to_add_later || [];
        if (relations.length === 0) continue;

        console.log(`   • ${dbKey} (${relations.length} relaciones)...`);

        for (const rel of relations) {
            const targetId = DB_IDS[rel.target as DatabaseKey];
            if (!targetId) {
                console.log(`      ⚠️ Target ${rel.target} no encontrado`);
                continue;
            }

            if (dryRun) {
                console.log(`      DRY-RUN: crearía relación ${rel.name} -> ${rel.target}`);
                continue;
            }

            await retryWithBackoff(async () => {
                await notionRateLimiter.waitIfNeeded();

                await notion.databases.update({
                    database_id: dbId,
                    properties: {
                        [rel.name]: {
                            relation: {
                                database_id: targetId,
                                type: "dual_property",
                                dual_property: {
                                    below: rel.dual_name_in_target
                                }
                            }
                        } as any
                    }
                });

                console.log(`      ✅ Relación creada: ${rel.name} <-> ${rel.target}`);
            });

            // Safety delay between relations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

/**
 * Main deployment function
 */
export async function deploy(notionToken: string, options: DeployOptions = {}): Promise<void> {
    const notion = new Client({ auth: notionToken });

    // Load manifest
    const manifestContent = readFileSync(MANIFEST_PATH, "utf-8");
    const manifest: Manifest = parse(manifestContent);

    console.log("=".repeat(80));
    console.log(options.dryRun ? "AUDITORÍA (DRY-RUN) DEL SISTEMA" : "FINALIZANDO CONFIGURACIÓN DEL SISTEMA");
    console.log("=".repeat(80));

    await updateDbProperties(notion, manifest, options);
    await createRelations(notion, manifest, options);

    console.log("\n" + "=".repeat(80));
    console.log(options.dryRun ? "AUDITORÍA COMPLETADA (SIN ESCRITURAS)" : "SISTEMA COMPLETADO Y LISTO");
    console.log("=".repeat(80));
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const token = process.argv[2];
    const dryRun = process.argv.includes("--dry-run");
    if (!token) {
        console.error("Usage: tsx src/core/deploy.ts <NOTION_TOKEN> [--dry-run]");
        process.exit(1);
    }
    deploy(token, { dryRun }).catch(console.error);
}
