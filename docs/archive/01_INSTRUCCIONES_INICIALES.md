<!-- File: docs/01_INSTRUCCIONES_INICIALES.md -->
# Instrucciones iniciales (modo despliegue)

Este documento es el punto de partida para operar **NOs**: qué se construye, con qué reglas y cómo verificar que quedó correcto.

## Principios de diseño (no negociables)
1. **Todo dato vive en una base de datos.** Se evitan páginas sueltas fuera de DB.
2. **Normalización mínima viable.** Evitar redundancia de “entidades” y “proyectos”.
3. **Separación clínica (silo).** DB clínica aislada en permisos y contenido (de-identificado).
4. **Idempotencia.** Ejecutar el despliegue múltiples veces no debe duplicar DBs ni romper enlaces.
5. **Compatibilidad MCP.** Preferir propiedades simples para minimizar fricción con automatización.

## Definition of Done del despliegue
Se considera desplegado si:
- Existe la página raíz **`NOs`**.
- Existen las 7 DB maestras bajo la raíz.
- Existen las relaciones mínimas (Tasks↔Projects, Tasks↔Entities, Knowledge↔Projects, etc.).
- Existe el rollup de progreso de proyectos (si tu schema lo incluye).
- Existen páginas dashboard: `COCKPIT`, `HOSPITAL & RESEARCH`, `SECOND BRAIN`.
- Existe seed mínimo para validar relaciones.
- El agente entrega un reporte con URLs/IDs y “manual finishing”.

## Restricciones prácticas
- Asumir que las vistas filtradas/linked views pueden requerir trabajo manual.
- Mantener el silo clínico de-identificado; no almacenar PHI/PII.
- Crear DBs primero; relaciones y rollups después.

## Pre-flight checklist
1. Notion: página raíz creada o lista para ser creada (título exacto: `NOs`).
2. Notion: la integración/agente tiene acceso a la raíz (editar).
3. Entorno del agente: Notion MCP disponible.
4. Smoke test: el agente puede buscar la raíz y crear una página de prueba (si está permitido).

## Post-flight checklist
1. Confirmar DBs y propiedades.
2. Probar relaciones (crear 1 proyecto y 1 tarea linkeada).
3. Probar rollup (marcar ✅ Done en 1 tarea y verificar %).
4. Configurar permisos del silo clínico.
5. Crear vistas manuales en COCKPIT (si aplica).
