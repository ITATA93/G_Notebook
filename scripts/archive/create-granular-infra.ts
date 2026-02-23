import { Client } from "@notionhq/client";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });

// Page ID of 'Core_Notion'
const CORE_NOTION_ID = "167af5db-be15-8016-af2d-d6027a05187e"; // ID of root page found earlier

async function createDatabase(parentId: string, title: string, icon: string, properties: any) {
    try {
        const response = await notion.databases.create({
            parent: { page_id: parentId },
            title: [{ type: "text", text: { content: title } }],
            icon: { type: "emoji", emoji: icon },
            properties: properties
        });
        console.log(`✅ Creada: ${title} (${response.id})`);
        return response.id;
    } catch (error: any) {
        console.error(`❌ Error creando ${title}:`, error.message);
        return null;
    }
}

async function setupInfrastructure() {
    console.log("🏗️ CREANDO INFRAESTRUCTURA GRANULAR (V3.0)\n");
    console.log("=".repeat(70));

    // Find Core_Notion page ID again just in case
    console.log("🔍 Buscando página raíz 'Core_Notion'...");
    const search = await notion.search({ filter: { property: 'object', value: 'page' } });
    const corePage = search.results.find((p: any) => p.properties?.title?.title?.[0]?.plain_text === "Core_Notion");

    if (!corePage) {
        throw new Error("No se encontró la página Core_Notion");
    }
    const parentId = corePage.id;
    console.log(`✅ Página raíz encontrada: ${parentId}\n`);

    // 1. Biblioteca 📚
    await createDatabase(parentId, "Biblioteca", "📚", {
        "Nombre": { title: {} },
        "Autores": { multi_select: {} }, // Fuente: BD_Libros
        "Editorial": { select: {} },
        "Año": { number: {} },           // Fuente: BD_Libros
        "ISBN": { rich_text: {} },       // Fuente: BD_Libros
        "Enlace Visor": { url: {} },     // Fuente: BD_Libros
        "Enlace Descarga": { url: {} },  // Fuente: BD_Libros
        "Archivo Digital": { files: {} }, // CRÍTICO
        "Portada": { files: {} },        // CRÍTICO
        "Estado": { select: { options: [{ name: "Por leer", color: "red" }, { name: "Leído", color: "green" }] } },
        "Categoría": { select: {} },     // Fuente: BD_Libros
        "Etiquetas": { multi_select: {} }, // Fuente: BD_Libros
        "Descripción": { rich_text: {} } // Fuente: BD_Libros
    });

    // 2. Videoteca 📹
    await createDatabase(parentId, "Videoteca", "📹", {
        "Título": { title: {} },
        "Especialidad": { select: {} },  // Fuente: BD_Videos
        "Institución": { select: {} },   // Fuente: BD_Videos
        "Instancia": { select: {} },     // Fuente: BD_Videos
        "Año": { number: {} },           // Fuente: BD_Videos
        "Archivo Video": { files: {} },  // CRÍTICO (Captura/GD Video)
        "Enlace Externo": { url: {} },
        "Descripción": { rich_text: {} }, // Fuente: GD Video File Name
        "Etiquetas": { multi_select: {} }
    });

    // 3. Papers y Publicaciones 🔬
    await createDatabase(parentId, "Papers y Publicaciones Científicas", "🔬", {
        "Título": { title: {} },
        "Autores": { multi_select: {} }, // Fuente: Repositorio
        "Journal/Revista": { select: {} },
        "Año": { number: {} },           // Fuente: Repositorio
        "DOI/Link": { url: {} },         // Fuente: Repositorio (Enlace)
        "Archivo PDF": { files: {} },    // CRÍTICO (Enlace/Property)
        "Tema": { multi_select: {} },    // Fuente: Repositorio
        "Subtema": { rich_text: {} },    // Fuente: Repositorio
        "Abstract": { rich_text: {} },   // Fuente: Repositorio (Contenido)
        "Estado": { select: { options: [{ name: "Por leer", color: "red" }, { name: "Leído", color: "green" }] } }
    });

    // 4. Guías Clínicas ⚕️
    await createDatabase(parentId, "Guías Clínicas", "⚕️", {
        "Nombre Guía": { title: {} },
        "Especialidad": { select: {} },  // Fuente: Repositorio (Tema)
        "Organismo": { select: {} },     // Fuente: Repositorio (Autores?)
        "Año": { number: {} },           // Fuente: Repositorio
        "Vigencia": { select: { options: [{ name: "Vigente", color: "green" }, { name: "Obsoleta", color: "gray" }] } },
        "Archivo PDF": { files: {} },    // CRÍTICO
        "Link Oficial": { url: {} },
        "Etiquetas": { multi_select: {} }
    });

    // 5. Normativas y Regulaciones ⚖️
    await createDatabase(parentId, "Normativas y Regulaciones", "⚖️", {
        "Nombre Norma": { title: {} },
        "Tipo": { select: { options: [{ name: "Ley", color: "orange" }, { name: "Decreto", color: "blue" }, { name: "Norma Técnica", color: "purple" }] } },
        "Número": { rich_text: {} },
        "Año": { number: {} },
        "Organismo": { select: {} },
        "Archivo PDF": { files: {} },    // CRÍTICO
        "Link BCN/Diario Oficial": { url: {} },
        "Estado": { select: { options: [{ name: "Vigente", color: "green" }, { name: "Derogada", color: "red" }] } }
    });

    // 6. Recursos Académicos (El resto) hg
    await createDatabase(parentId, "Recursos Académicos", "🎒", {
        "Nombre": { title: {} },
        "Tipo": { select: {} },          // Apunte, Presentación, Clase
        "Materia": { multi_select: {} }, // Fuente: Repositorio (Tema)
        "Archivo": { files: {} },        // CRÍTICO
        "Link": { url: {} },
        "Descripción": { rich_text: {} },
        "Etiquetas": { multi_select: {} }
    });

    console.log("\n✅ Infraestructura completa creada.");
}

setupInfrastructure().catch(console.error);

