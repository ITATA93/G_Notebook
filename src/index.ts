/**
 * Unified CLI for NOs system
 * Single entry point for all operations
 */

import { Command } from "commander";
import { config } from "dotenv";
import { DB_IDS, NOTION_API_VERSION } from "./config.js";
import { deploy } from "./core/deploy.js";
import { syncCanvas } from "./sync/canvas.js";
import { seedCompleteSystem } from "./core/seed.js";

// Load environment variables
config();

const program = new Command();

program
    .name("nos")
    .description("NOs - Notion Operating System CLI")
    .version("1.0.0");

// Deploy command
program
    .command("deploy")
    .description("Deploy NOs system to Notion")
    .requiredOption("--notion-token <token>", "Notion integration token")
    .option("--dry-run", "Audit mode, no writes")
    .action(async (options) => {
        await deploy(options.notionToken, { dryRun: Boolean(options.dryRun) });
    });

// Sync command
const syncCmd = program
    .command("sync")
    .description("Sync data from external sources");

syncCmd
    .command("canvas")
    .description("Sync from Canvas LMS")
    .requiredOption("--canvas-token <token>", "Canvas API token")
    .requiredOption("--notion-token <token>", "Notion integration token")
    .option("--url <url>", "Canvas URL", "https://uandes.instructure.com")
    .option("--dry-run", "Audit mode, no writes")
    .action(async (options) => {
        await syncCanvas(options.canvasToken, options.notionToken, options.url, Boolean(options.dryRun));
    });

syncCmd
    .command("gmail")
    .description("Sync from Gmail")
    .action(async () => {
        console.log("Gmail sync no implementado en TypeScript. Comando deshabilitado.");
    });

// Seed command
program
    .command("seed")
    .description("Seed initial data (Areas/Categories)")
    .requiredOption("--notion-token <token>", "Notion integration token")
    .option("--dry-run", "Audit mode, no writes")
    .action(async (options) => {
        await seedCompleteSystem(options.notionToken, { dryRun: Boolean(options.dryRun) });
    });

// Diagnose command
program
    .command("diagnose")
    .description("Diagnose system health")
    .option("-v, --verbose", "Verbose output")
    .action((options) => {
        console.log("🔎 Diagnosing NOs system...");
        console.log(`   API Version: ${NOTION_API_VERSION}`);
        console.log(`   Databases: ${Object.keys(DB_IDS).length}`);

        for (const dbKey of Object.keys(DB_IDS)) {
            console.log(`      - ${dbKey}`);
        }

        if (options.verbose) {
            console.log("\n📄 Database IDs:");
            for (const [dbKey, dbId] of Object.entries(DB_IDS)) {
                console.log(`   ${dbKey}: ${dbId}`);
            }
        }
    });

// Info command
program
    .command("info")
    .description("Show system information")
    .action(() => {
        console.log("NOs - Notion Operating System");
        console.log("Version: 1.0.0 (TypeScript)");
        console.log(`Databases: ${Object.keys(DB_IDS).length}`);
        console.log(`API Version: ${NOTION_API_VERSION}`);
        console.log("\nFor detailed documentation, see: project_memory.md");
    });

program.parse();
