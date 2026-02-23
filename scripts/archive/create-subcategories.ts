import { Client } from "@notionhq/client";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const PAGE_ID = "2d6af5dbbe15806b96f3d186e6ce906f";

const notion = new Client({ auth: TOKEN });

async function createSubcategoriesDB() {
    console.log("📦 Creando: Subcategorías 📂");
    const response = await notion.databases.create({
        parent: { page_id: PAGE_ID },
        title: [{ text: { content: "Subcategorías" } }],
        icon: { emoji: "📂" },
        properties: {
            "Nombre": { title: {} }
        }
    });
    console.log(`✅ Creada! ID: ${response.id}`);
    return response.id;
}

createSubcategoriesDB()
    .then(id => {
        console.log(`\n📝 Actualiza config.ts con:`);
        console.log(`DB_SUBCATEGORIES: "${id}",`);
    })
    .catch(console.error);

