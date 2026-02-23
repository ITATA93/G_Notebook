import { Client } from "@notionhq/client";
import { config } from "dotenv";

// Load environment variables from .env
config();

const TOKEN = process.env.NOTION_TOKEN;
const DB_KNOWLEDGE_BASE = process.env.DB_KNOWLEDGE_BASE_ID;
const DRY_RUN = process.env.DRY_RUN === "true";

if (!TOKEN) {
    throw new Error("NOTION_TOKEN env var is required");
}

if (!DB_KNOWLEDGE_BASE) {
    throw new Error("DB_KNOWLEDGE_BASE_ID env var is required");
}

const notion = new Client({ auth: TOKEN });

async function addMissingProperties() {
    console.log("ÐY\"õ AGREGANDO PROPIEDADES FALTANTES A DB_KNOWLEDGE_BASE\n");
    console.log("=".repeat(70));

    const propertiesToAdd = {
        "Año": { number: {} },
        "ISBN": { rich_text: {} },
        "Descripción": { rich_text: {} },
        "Portada": { files: {} },
        "Especialidad": { select: { options: [] } },
        "Institución": { select: { options: [] } },
        "Tema": { multi_select: { options: [] } }
    };

    if (DRY_RUN) {
        console.log("Dry run enabled. The following properties would be added:");
        for (const prop of Object.keys(propertiesToAdd)) {
            console.log(`   - ${prop}`);
        }
        return;
    }

    try {
        await notion.databases.update({
            database_id: DB_KNOWLEDGE_BASE,
            properties: propertiesToAdd
        });

        console.log("ƒo. Propiedades agregadas exitosamente:");
        for (const prop of Object.keys(propertiesToAdd)) {
            console.log(`   - ${prop}`);
        }
    } catch (error: any) {
        console.error("ƒ?O Error:", error.message);
        throw error;
    }
}

addMissingProperties().catch(console.error);
