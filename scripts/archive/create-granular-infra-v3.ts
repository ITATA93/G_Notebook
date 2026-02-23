import { Client } from "@notionhq/client";

const TOKEN = process.env.NOTION_TOKEN ?? "";
const notion = new Client({ auth: TOKEN });
const CORE_NOTION_ID = "2d6af5db-be15-806b-96f3-d186e6ce906f";

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
    console.log("🏗️ CREANDO INFRAESTRUCTURA GRANULAR (V3.0) - ESPAÑOL\n");
    console.log("=".repeat(70));

    // 1. Encontrar página raíz 'Core_Notion'
    const parentId = CORE_NOTION_ID;
    console.log(`✅ Página raíz encontrada: ${parentId}\n`);

    // 2. Biblioteca 📚 (Exclusiva para Libros)
    await createDatabase(parentId, "Biblioteca", "📚", {
        "Nombre": { title: {} },
        "Autores": { multi_select: {} }, // Fuente: BD_Libros
        "Editorial": { select: {} },
        "Año": { number: {} },           // Fuente: BD_Libros
        "ISBN": { rich_text: {} },       // Fuente: BD_Libros
        "Enlace Visor": { url: {} },     // Fuente: BD_Libros
        "Enlace Descarga": { url: {} },  // Fuente: BD_Libros
        "Archivo Digital": { files: {} }, // CRÍTICO: Para el PDF del libro
        "Portada": { files: {} },        // CRÍTICO: Para la imagen de portada
        "Estado": { select: { options: [{ name: "Por leer", color: "red" }, { name: "Leído", color: "green" }] } },
        "Categoría": { select: {} },     // Fuente: BD_Libros (Categoria)
        "Etiquetas": { multi_select: {} }, // Fuente: BD_Libros (Etiquetas)
        "Descripción": { rich_text: {} } // Fuente: BD_Libros
    });

    // 3. Videoteca 📹 (Exclusiva para Videos)
    await createDatabase(parentId, "Videoteca", "📹", {
        "Título": { title: {} },
        "Especialidad": { select: {} },  // Fuente: BD_Videos
        "Institución": { select: {} },   // Fuente: BD_Videos
        "Instancia": { select: {} },     // Fuente: BD_Videos
        "Año": { number: {} },           // Fuente: BD_Videos
        "Archivo Video": { files: {} },  // CRÍTICO: Captura/GD Video
        "Enlace Externo": { url: {} },
        "Descripción": { rich_text: {} }, // Fuente: GD Video File Name
        "Etiquetas": { multi_select: {} } // Para tags adicionales
    });

    // 4. Papers y Publicaciones Científicas 🔬 (Desde Repositorio)
    await createDatabase(parentId, "Papers y Publicaciones Científicas", "🔬", {
        "Título": { title: {} },
        "Autores": { multi_select: {} }, // Fuente: Repositorio
        "Revista/Journal": { select: {} },
        "Año": { number: {} },           // Fuente: Repositorio
        "DOI/Link": { url: {} },         // Fuente: Repositorio (Enlace)
        "Archivo PDF": { files: {} },    // CRÍTICO: Para el paper
        "Tema": { multi_select: {} },    // Fuente: Repositorio
        "Abstract": { rich_text: {} },   // Fuente: Repositorio (Contenido)
        "Estado": { select: { options: [{ name: "Por leer", color: "red" }, { name: "Leído", color: "green" }] } }
    });

    // 5. Guías Clínicas ⚕️ (Desde Repositorio)
    await createDatabase(parentId, "Guías Clínicas", "⚕️", {
        "Nombre Guía": { title: {} },
        "Especialidad": { select: {} },  // Fuente: Repositorio (Tema)
        "Organismo": { select: {} },     // Fuente: Repositorio (Autores?)
        "Año": { number: {} },           // Fuente: Repositorio
        "Vigencia": { select: { options: [{ name: "Vigente", color: "green" }, { name: "Obsoleta", color: "gray" }] } },
        "Archivo PDF": { files: {} },    // CRÍTICO: PDF de la guía
        "Link Oficial": { url: {} },
        "Etiquetas": { multi_select: {} }
    });

    // 6. Normativas y Regulaciones ⚖️ (Desde Repositorio)
    await createDatabase(parentId, "Normativas y Regulaciones", "⚖️", {
        "Nombre Norma": { title: {} },
        "Tipo": { select: { options: [{ name: "Ley", color: "orange" }, { name: "Decreto", color: "blue" }, { name: "Norma Técnica", color: "purple" }] } },
        "Número": { rich_text: {} },
        "Año": { number: {} },
        "Organismo": { select: {} },     // Minsal, Gobierno, etc.
        "Archivo PDF": { files: {} },    // CRÍTICO: PDF de la norma
        "Link Oficial": { url: {} },
        "Estado": { select: { options: [{ name: "Vigente", color: "green" }, { name: "Derogada", color: "red" }] } }
    });

    // 7. Recursos Académicos 🎒 (Resto del Repositorio + BD_Clases)
    await createDatabase(parentId, "Recursos Académicos", "🎒", {
        "Nombre": { title: {} },
        "Tipo": { select: {} },          // Apunte, Presentación, Clase
        "Materia": { multi_select: {} }, // Fuente: Repositorio (Tema)
        "Archivo": { files: {} },        // CRÍTICO: PPTs, Docs
        "Link": { url: {} },
        "Descripción": { rich_text: {} },
        "Etiquetas": { multi_select: {} }
    });

    console.log("\n✅ Infraestructura completa creada correctamente.");
}

setupInfrastructure().catch(console.error);

