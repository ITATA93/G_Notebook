/**
 * Template Definitions for NOs Databases
 * Defines standard block structures for specific use cases
 */

import { DatabaseKey } from "../config.js";

interface PageTemplate {
    name: string;
    icon?: string; // Emoji
    blocks: any[]; // Notion Block Objects
}

export const TEMPLATES: Record<DatabaseKey, PageTemplate[]> = {
    // ------------------------------------------------------------------
    // 1. 🏛️ ÁREAS MAESTRAS ("AREAS" DB)
    // ------------------------------------------------------------------
    DB_AREAS: [
        {
            name: "Área Estándar",
            icon: "🏛️",
            blocks: [
                { heading_2: { rich_text: [{ text: { content: "📜 Descripción del Dominio" } }] } },
                { paragraph: { rich_text: [{ text: { content: "¿Qué abarca esta área de vida?" } }] } }
            ]
        }
    ],

    // ------------------------------------------------------------------
    // 2. 📂 SUBCATEGORÍAS (Áreas de Trabajo Continuo)
    // ------------------------------------------------------------------
    DB_SUBCATEGORIES: [],

    // ------------------------------------------------------------------
    // 3. 🚀 PROYECTOS (Objetivos con Fecha de Fin)
    // ------------------------------------------------------------------
    DB_PROJECTS: [
        {
            name: "Proyecto Estándar",
            icon: "🚀",
            blocks: [
                { heading_2: { rich_text: [{ text: { content: "🎯 Objetivo (Definition of Done)" } }] } },
                { paragraph: { rich_text: [{ text: { content: "¿Qué éxito define a este proyecto?" } }] } },
                { heading_2: { rich_text: [{ text: { content: "✅ Plan de Acción (Macro-Tareas)" } }] } },
                { to_do: { rich_text: [{ text: { content: "Fase 1: " } }] } },
                { heading_2: { rich_text: [{ text: { content: "🧠 Bitácora / Recursos" } }] } },
                { toggle: { rich_text: [{ text: { content: "Notas Rápidas" } }] } }
            ]
        },
        {
            name: "Evento / Viaje", // Congresos, Vacaciones
            icon: "✈️",
            blocks: [
                { heading_2: { rich_text: [{ text: { content: "📍 Logística" } }] } },
                { to_do: { rich_text: [{ text: { content: "Tickets / Reservas (Adjuntar en Finanzas)" } }] } },
                { heading_2: { rich_text: [{ text: { content: "📅 Itinerario General" } }] } },
                { heading_2: { rich_text: [{ text: { content: "🤝 Networking / Personas" } }] } }
            ]
        },
        {
            name: "Programa Académico", // Magister, Diplomado
            icon: "🎓",
            blocks: [
                { heading_2: { rich_text: [{ text: { content: "📅 Syllabus / Fechas Clave" } }] } },
                { heading_2: { rich_text: [{ text: { content: "📚 Bibliografía (Docs en Knowledge)" } }] } },
                { heading_2: { rich_text: [{ text: { content: "📝 Notas de Clases (Links a Meetings)" } }] } }
            ]
        }
    ],

    // ------------------------------------------------------------------
    // 2. 🏎️ ENTIDADES ("ENTITIES / ASSETS" DB)
    // ------------------------------------------------------------------
    DB_ENTITIES_ASSETS: [
        {
            name: "Ficha Persona (CRM)", // Familia, Amigos, Pacientes VIP
            icon: "👤",
            blocks: [
                { callout: { rich_text: [{ text: { content: "🎂 Cumpleaños / Datos Clave" } }], icon: { emoji: "🎉" } } },
                { heading_2: { rich_text: [{ text: { content: "🎁 Preferencias / Regalos" } }] } },
                { heading_2: { rich_text: [{ text: { content: "🕰️ Historial Interacciones" } }] } }
            ]
        },
        {
            name: "Activo Físico", // Auto, Casa
            icon: "🏠",
            blocks: [
                { heading_2: { rich_text: [{ text: { content: "📄 Documentación Legal" } }] } },
                { heading_2: { rich_text: [{ text: { content: "🔧 Mantenimientos / Reparaciones" } }] } },
                { heading_2: { rich_text: [{ text: { content: "🧾 Seguros / Polizas" } }] } }
            ]
        }
    ],

    // ------------------------------------------------------------------
    // 3. 📅 EVENTOS ("MEETINGS" DB)
    // ------------------------------------------------------------------
    DB_MEETINGS_CLASSES: [
        {
            name: "Turno / Guardia", // Hospital
            icon: "🏥",
            blocks: [
                { heading_2: { rich_text: [{ text: { content: "⚠️ Pendientes de Entrega" } }] } },
                { heading_2: { rich_text: [{ text: { content: "📝 Novedades Turno" } }] } },
                { heading_2: { rich_text: [{ text: { content: "📋 Pacientes Críticos" } }] } }
            ]
        },
        {
            name: "Clase / Seminario", // Académico
            icon: "📚",
            blocks: [
                { heading_2: { rich_text: [{ text: { content: "📝 Apuntes de Clase" } }] } },
                { heading_2: { rich_text: [{ text: { content: "📸 Capturas / Pizarra" } }] } },
                { heading_2: { rich_text: [{ text: { content: "❓ Dudas / Preguntas" } }] } }
            ]
        }
    ],

    // ------------------------------------------------------------------
    // 4. 🏥 REGISTRO QUIRÚRGICO ("SURGICAL" DB)
    // ------------------------------------------------------------------
    DB_SURGICAL_LOG: [
        {
            name: "Protocolo Operatorio",
            icon: "😷",
            blocks: [
                { toggle: { rich_text: [{ text: { content: "🔒 ID Paciente (Anonimizado)" } }] } },
                { heading_2: { rich_text: [{ text: { content: "🔎 Diagnóstico Pre/Post" } }] } },
                { heading_2: { rich_text: [{ text: { content: "🔪 Técnica Detallada" } }] } },
                { heading_2: { rich_text: [{ text: { content: "⚠️ Hallazgos / Complicaciones" } }] } }
            ]
        }
    ],

    // ------------------------------------------------------------------
    // 5. 📚 RECURSOS ("KNOWLEDGE" DB)
    // ------------------------------------------------------------------
    DB_KNOWLEDGE_BASE: [
        {
            name: "Review Paper / Guía",
            icon: "📄",
            blocks: [
                { quote: { rich_text: [{ text: { content: "📌 Resumen / Abstract" } }] } },
                { heading_2: { rich_text: [{ text: { content: "🔑 Puntos Clave" } }] } },
                { heading_2: { rich_text: [{ text: { content: "💡 Aplicación Clínica" } }] } },
                { heading_2: { rich_text: [{ text: { content: "🔗 Referencias" } }] } }
            ]
        }
    ],

    // ------------------------------------------------------------------
    // 6. 💰 REGISTROS ("FINANCE" & "METRICS")
    // ------------------------------------------------------------------
    DB_METRICS_LOG: [
        {
            name: "Journal Diario",
            icon: "📓",
            blocks: [
                { heading_2: { rich_text: [{ text: { content: "🌅 Inicio de Día" } }] } },
                { paragraph: { rich_text: [{ text: { content: "Intención de hoy..." } }] } },
                { heading_2: { rich_text: [{ text: { content: "🌃 Cierre de Día" } }] } },
                { paragraph: { rich_text: [{ text: { content: "Logros / Aprendizajes..." } }] } }
            ]
        }
    ],
    DB_FINANCE_LEDGER: [
        {
            name: "Transacción Complex",
            icon: "💸",
            blocks: [
                { heading_2: { rich_text: [{ text: { content: "📄 Comprobante Adjunto" } }] } },
                { heading_2: { rich_text: [{ text: { content: "📝 Detalles" } }] } }
            ]
        }
    ],

    // Otors (Tasks, Emails, Canvas Courses specific)
    DB_MASTER_TASKS: [],
    DB_CANVAS_COURSES: [],
    DB_EMAILS: []
};
