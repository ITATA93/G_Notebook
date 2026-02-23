import { Client } from "@notionhq/client";
import { writeFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

async function searchAllDatabases() {
    console.log("🔍 SEARCHING FOR ALL DATABASES IN WORKSPACE...\n");

    try {
        // Search for all databases
        const response = await notion.search({
            filter: {
                property: 'object',
                value: 'database'
            },
            page_size: 100
        });

        console.log(`📊 Found ${response.results.length} databases\n`);
        console.log("=".repeat(70));

        const databases: any[] = [];

        for (const db of response.results) {
            const database = db as any;
            const title = database.title?.[0]?.plain_text || "Untitled";
            const id = database.id;

            console.log(`\n📚 ${title}`);
            console.log(`   ID: ${id}`);
            console.log(`   Icon: ${database.icon?.emoji || "none"}`);
            console.log(`   Created: ${database.created_time.split('T')[0]}`);
            console.log(`   Last edited: ${database.last_edited_time.split('T')[0]}`);

            // Get page count
            try {
                const pages = await notion.databases.query({
                    database_id: id,
                    page_size: 1
                });

                // Get full count
                const fullQuery = await notion.databases.query({
                    database_id: id,
                    page_size: 100
                });

                console.log(`   Pages: ${fullQuery.results.length}`);

                // Get properties
                const dbInfo = await notion.databases.retrieve({ database_id: id });
                const props = (dbInfo as any).properties;
                const propNames = Object.keys(props);

                console.log(`   Properties: ${propNames.slice(0, 5).join(', ')}${propNames.length > 5 ? '...' : ''}`);

                databases.push({
                    title,
                    id,
                    icon: database.icon?.emoji,
                    pageCount: fullQuery.results.length,
                    properties: propNames,
                    created: database.created_time,
                    lastEdited: database.last_edited_time
                });

            } catch (error: any) {
                console.log(`   ⚠️ Could not query: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Save results
        writeFileSync('all-databases-inventory.json', JSON.stringify(databases, null, 2));
        console.log("\n\n✅ Complete inventory saved to all-databases-inventory.json");

        // Categorize databases
        console.log("\n\n📋 DATABASE CATEGORIZATION");
        console.log("=".repeat(70));

        const legacy = databases.filter(db =>
            db.title.includes('BD_') ||
            db.title.includes('SBD_') ||
            db.title.includes('Categoría') ||
            db.title.includes('SubCategoría')
        );

        const newSystem = databases.filter(db =>
            db.title.includes('Áreas') ||
            db.title.includes('Proyectos') ||
            db.title.includes('Subcategorías') ||
            db.title.includes('Tareas Maestras') ||
            db.title.includes('Conocimiento') ||
            db.title.includes('Finanzas')
        );

        const other = databases.filter(db =>
            !legacy.includes(db) && !newSystem.includes(db)
        );

        console.log(`\n🗂️ LEGACY DATABASES (${legacy.length}):`);
        legacy.forEach(db => console.log(`   - ${db.title} (${db.pageCount} pages)`));

        console.log(`\n✨ NEW CORE_NOTION DATABASES (${newSystem.length}):`);
        newSystem.forEach(db => console.log(`   - ${db.title} (${db.pageCount} pages)`));

        console.log(`\n📦 OTHER DATABASES (${other.length}):`);
        other.forEach(db => console.log(`   - ${db.title} (${db.pageCount} pages)`));

        return { legacy, newSystem, other, all: databases };

    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        return null;
    }
}

searchAllDatabases().catch(console.error);

