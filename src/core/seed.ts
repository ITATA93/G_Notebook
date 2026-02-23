/**
 * Seed data generator for Core_Notion
 * Creates master areas, subcategories, projects and entities
 */

import { Client } from "@notionhq/client";
import { DB_IDS } from "../config.js";
import { getAllDatabasePages, retryWithBackoff, notionRateLimiter } from "../utils/helpers.js";

type SeedOptions = {
    dryRun?: boolean;
};

// Áreas maestras (Top Level)
const MASTER_AREAS = [
    { name: "Educación Continua", icon: "🎓", dominio: "Academia", description: "Formación profesional: cursos, congresos, talleres." },
    { name: "Oncología", icon: "🧬", dominio: "Clínica", description: "Casos y documentación vinculada a oncología." },
    { name: "Pendiente", icon: "⏳", dominio: "Personal", description: "Tareas o ideas rápidas aún sin categorizar." },
    { name: "Beca", icon: "🎖️", dominio: "Academia", description: "Postulaciones o gestiones de becas y beneficios educacionales." },
    { name: "Efemérides", icon: "📅", dominio: "Personal", description: "Fechas conmemorativas relevantes." },
    { name: "Finanzas", icon: "💰", dominio: "Finanzas", description: "Gastos, presupuestos e informes económicos." },
    { name: "Proyecto Alma", icon: "🚀", dominio: "Clínica", description: "Sistema de gestión clínica y subproyectos asociados." },
    { name: "Hospital Ovalle", icon: "🏥", dominio: "Clínica", description: "Proyectos o registros vinculados al hospital." },
    { name: "Docencia", icon: "🧑‍🏫", dominio: "Academia", description: "Clases, evaluaciones y planificación académica." },
    { name: "Rutina y Salud", icon: "🏃", dominio: "Personal", description: "Hábitos personales de autocuidado." },
    { name: "Personal", icon: "👤", dominio: "Personal", description: "Temas privados o no laborales." }
];

// Subcategorías
const SUBCATEGORIES = [
    { name: "Artículos por Leer", parent: "Educación Continua" },
    { name: "Guías Clínicas por Leer", parent: "Educación Continua" },
    { name: "Libros por Leer", parent: "Educación Continua" },
    { name: "Cursos", parent: "Educación Continua" },
    { name: "Seminarios Quirúrgicos", parent: "Docencia" },
    { name: "Seminarios Internos", parent: "Docencia" },
    { name: "Internado Medicina", parent: "Docencia" },
    { name: "Urgencias", parent: "Hospital Ovalle" },
    { name: "Oncología Partes Blandas", parent: "Oncología" },
    { name: "Jornada laboral", parent: "Hospital Ovalle" },
    { name: "Alma AMB", parent: "Proyecto Alma" },
    { name: "Alma HOSP", parent: "Proyecto Alma" },
    { name: "Alma Urgencias", parent: "Proyecto Alma" },
    { name: "Gastos Fijos", parent: "Finanzas" },
    { name: "Cuentas", parent: "Finanzas" },
    { name: "Boletas", parent: "Finanzas" },
    { name: "Sueldo", parent: "Finanzas" },
    { name: "Supermercado", parent: "Personal" },
    { name: "Organización", parent: "Personal" },
    { name: "Ideas", parent: "Personal" },
    { name: "Pendientes", parent: "Pendiente" },
    { name: "Documentación", parent: "Personal" },
    { name: "Conciertos", parent: "Personal" },
    { name: "Fármacos", parent: "Rutina y Salud" },
    { name: "Hábitos", parent: "Rutina y Salud" },
    { name: "Gimnasio", parent: "Rutina y Salud" },
    { name: "Salud", parent: "Rutina y Salud" },
    { name: "Alimentación", parent: "Rutina y Salud" },
    { name: "Suplementos", parent: "Rutina y Salud" },
    { name: "Cumpleaños Cercanos", parent: "Efemérides" },
    { name: "Feriados", parent: "Efemérides" }
];

// Proyectos
const PROJECTS = [
    { name: "Magister Epidemiología", parent: "Educación Continua" },
    { name: "Camino a Plástica", parent: "Beca" },
    { name: "Diplomado Cirugía", parent: "Educación Continua" },
    { name: "Trabajos a Publicar", parent: "Educación Continua" },
    { name: "Congresos de Cirugía", parent: "Educación Continua" },
    { name: "ALMA", parent: "Proyecto Alma" },
    { name: "Vacaciones", parent: "Personal" },
    { name: "Proyecto: Guías Clínicas", parent: "Hospital Ovalle" },
    { name: "Proyecto: Calendario MQ1", parent: "Hospital Ovalle" },
    { name: "Consultoría de Llamado", parent: "Finanzas" },
    { name: "Plan 33.000", parent: "Finanzas" },
    { name: "Plan 500", parent: "Finanzas" },
    { name: "Proyecto Clínica", parent: "Finanzas" },
    { name: "Base de Datos", parent: "Finanzas" }
];

// Entidades (Activos/Personas)
const ENTITIES = [
    { name: "Automóvil", tipo: "Activo Físico" },
    { name: "Familia", tipo: "Persona" },
    { name: "Hospital", tipo: "Institución" }
];

export async function seedCompleteSystem(notionToken: string, options: SeedOptions = {}): Promise<void> {
    const { dryRun = false } = options;
    const notion = new Client({ auth: notionToken });
    console.log("🚀 SEEDING CORE_NOTION (COMPLETE)...\n");

    const getTitle = (page: any, propertyName: string = "Nombre"): string | undefined => {
        const prop = page.properties?.[propertyName];
        if (!prop || prop.type !== "title") return undefined;
        return prop.title?.[0]?.plain_text;
    };

    console.log("🔎 Cargando registros existentes desde Notion...");
    const [existingAreas, existingSubcategories, existingProjects, existingEntities] = await Promise.all([
        retryWithBackoff(async () => getAllDatabasePages(notion, DB_IDS.DB_AREAS)),
        retryWithBackoff(async () => getAllDatabasePages(notion, DB_IDS.DB_SUBCATEGORIES)),
        retryWithBackoff(async () => getAllDatabasePages(notion, DB_IDS.DB_PROJECTS)),
        retryWithBackoff(async () => getAllDatabasePages(notion, DB_IDS.DB_ENTITIES_ASSETS))
    ]);

    const areaIds: Record<string, string> = {};
    for (const page of existingAreas) {
        const name = getTitle(page);
        if (name) {
            areaIds[name] = page.id;
        }
    }

    const existingSubcategoryNames = new Set<string>();
    for (const page of existingSubcategories) {
        const name = getTitle(page);
        if (name) {
            existingSubcategoryNames.add(name);
        }
    }

    const existingProjectNames = new Set<string>();
    for (const page of existingProjects) {
        const name = getTitle(page);
        if (name) {
            existingProjectNames.add(name);
        }
    }

    const existingEntityNames = new Set<string>();
    for (const page of existingEntities) {
        const name = getTitle(page);
        if (name) {
            existingEntityNames.add(name);
        }
    }

    // 1. CREATE MASTER AREAS
    console.log("📌 Fase 1: Áreas Maestras (DB_AREAS)");
    for (const area of MASTER_AREAS) {
        const action = async () => {
            await notionRateLimiter.waitIfNeeded();

            const existingId = areaIds[area.name];
            if (existingId) {
                areaIds[area.name] = existingId;
                console.log(`   ↺ ${area.icon} ${area.name}`);
                return;
            }

            if (dryRun) {
                console.log(`   DRY-RUN: crearía ${area.icon} ${area.name}`);
                return;
            }

            const page = await notion.pages.create({
                parent: { database_id: DB_IDS.DB_AREAS },
                icon: { emoji: area.icon as any },
                properties: {
                    Nombre: { title: [{ text: { content: area.name } }] },
                    Dominio: { select: { name: area.dominio } },
                    Descripción: { rich_text: [{ text: { content: area.description } }] }
                }
            });
            areaIds[area.name] = page.id;
            console.log(`   ✅ ${area.icon} ${area.name}`);
        };
        await retryWithBackoff(action);
    }

    // 2. CREATE SUBCATEGORIES
    console.log("\n🪜 Fase 2: Subcategorías (DB_SUBCATEGORIES)");
    for (const subcat of SUBCATEGORIES) {
        const parentId = areaIds[subcat.parent];
        if (!parentId) {
            console.warn(`   ⚠️ Parent no encontrado: ${subcat.parent} para ${subcat.name}`);
            continue;
        }

        const action = async () => {
            await notionRateLimiter.waitIfNeeded();

            if (existingSubcategoryNames.has(subcat.name)) {
                console.log(`   ↺ ${subcat.name}`);
                return;
            }

            if (dryRun) {
                console.log(`   DRY-RUN: crearía ${subcat.name} ← ${subcat.parent}`);
                return;
            }

            await notion.pages.create({
                parent: { database_id: DB_IDS.DB_SUBCATEGORIES },
                properties: {
                    Nombre: { title: [{ text: { content: subcat.name } }] },
                    Área: { relation: [{ id: parentId }] }
                }
            });
            existingSubcategoryNames.add(subcat.name);
            console.log(`   ✅ ${subcat.name} ← ${subcat.parent}`);
        };
        await retryWithBackoff(action);
    }

    // 3. CREATE PROJECTS
    console.log("\n📂 Fase 3: Proyectos (DB_PROJECTS)");
    for (const project of PROJECTS) {
        const parentId = areaIds[project.parent];
        if (!parentId) {
            console.warn(`   ⚠️ Parent no encontrado: ${project.parent} para ${project.name}`);
            continue;
        }

        const action = async () => {
            await notionRateLimiter.waitIfNeeded();

            if (existingProjectNames.has(project.name)) {
                console.log(`   ↺ ${project.name}`);
                return;
            }

            if (dryRun) {
                console.log(`   DRY-RUN: crearía ${project.name} ← ${project.parent}`);
                return;
            }

            await notion.pages.create({
                parent: { database_id: DB_IDS.DB_PROJECTS },
                properties: {
                    Nombre: { title: [{ text: { content: project.name } }] },
                    Estado: { select: { name: "En Curso" } },
                    Área: { relation: [{ id: parentId }] }
                }
            });
            existingProjectNames.add(project.name);
            console.log(`   ✅ ${project.name} ← ${project.parent}`);
        };
        await retryWithBackoff(action);
    }

    // 4. CREATE ENTITIES
    console.log("\n🏷️ Fase 4: Entidades (DB_ENTITIES_ASSETS)");
    for (const entity of ENTITIES) {
        const action = async () => {
            await notionRateLimiter.waitIfNeeded();

            if (existingEntityNames.has(entity.name)) {
                console.log(`   ↺ ${entity.name}`);
                return;
            }

            if (dryRun) {
                console.log(`   DRY-RUN: crearía ${entity.name} (${entity.tipo})`);
                return;
            }

            await notion.pages.create({
                parent: { database_id: DB_IDS.DB_ENTITIES_ASSETS },
                properties: {
                    Nombre: { title: [{ text: { content: entity.name } }] },
                    Tipo: { select: { name: entity.tipo } }
                }
            });
            existingEntityNames.add(entity.name);
            console.log(`   ✅ ${entity.name} (${entity.tipo})`);
        };
        await retryWithBackoff(action);
    }

    console.log("\n🎉 Seed completo");
}

// CLI (optional direct run)
if (import.meta.url === `file://${process.argv[1]}`) {
    const token = process.argv[2];
    const dry = process.argv.includes("--dry-run");
    if (!token) {
        console.error("Uso: tsx src/core/seed.ts <NOTION_TOKEN> [--dry-run]");
        process.exit(1);
    }
    seedCompleteSystem(token, { dryRun: dry }).catch(console.error);
}
