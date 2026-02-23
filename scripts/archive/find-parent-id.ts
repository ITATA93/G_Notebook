import { Client } from "@notionhq/client";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

const DB_AREAS_ID = "2d7af5db-be15-81e9-9630-e633d6cf9075"; // Áreas Maestras

async function findParentPage() {
    console.log("🔍 BUSCANDO CONSTELACIÓN PADRE\n");

    try {
        const db = await notion.databases.retrieve({ database_id: DB_AREAS_ID });
        const parent = db.parent;

        console.log("Infraestructura encontrada:");
        console.log(`   Hijo: ${(db as any).title?.[0]?.plain_text}`);

        if (parent.type === "page_id") {
            const pageId = parent.page_id;
            console.log(`✅ PADRE DETECTADO: ${pageId}`);

            // Verify parent title
            const page = await notion.pages.retrieve({ page_id: pageId });
            const title = (page as any).properties?.title?.title?.[0]?.plain_text || "Untitled";
            console.log(`   Nombre del Padre: ${title}`);

            if (title === "Core_Notion") {
                console.log("\nConfirmado: Es la página raíz correcta.");
            }
        } else {
            console.log("❌ El padre no es una página:", parent.type);
        }

    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

findParentPage().catch(console.error);

