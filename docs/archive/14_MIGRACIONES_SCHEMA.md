<!-- File: docs/14_MIGRACIONES_SCHEMA.md -->
# Migraciones de schema (cambios controlados)

Este documento define cómo evolucionar el schema sin romper el sistema.

## Regla 1 — Manifest como fuente de verdad
- Todo cambio de schema debe reflejarse en `manifests/nos.yaml`.

## Regla 2 — ADR para decisiones importantes
Crea un ADR cuando:
- cambias un nombre de propiedad usada por relaciones/rollups
- cambias taxonomía de Estados/Prioridad/Tags con impacto
- divides o fusionas DBs

## Regla 3 — No romper referencias
Evitar:
- renombrar DBs en Notion sin actualizar manifest
- eliminar propiedades que participan en rollups/relations

## Proceso recomendado
1) Editar `manifests/nos.yaml`
2) Registrar ADR (si aplica)
3) Ejecutar `prompts/GEMINI_REPAIR_PROMPT.md`
4) QA con `docs/13_CHECKLIST_CALIDAD.md`
5) (Opcional) Limpiar seeds `[DEMO]`

## Cambios típicos y cómo hacerlos
### A) Agregar una propiedad nueva (seguro)
- Añadir en manifest → repair → QA.

### B) Renombrar una propiedad (riesgoso)
- Recomendación: crear una nueva propiedad y migrar datos manualmente
- Luego de migración, deprecar la antigua (no borrarla inmediatamente)
- Registrar ADR.

### C) Cambiar opciones de Select/Multi-select
- Añadir opciones en manifest
- repair
- QA
- Migrar valores antiguos si cambió el nombre exacto (manual)

### D) Cambiar relaciones
- Añadir relación nueva
- Migrar links gradualmente
- Deprecar relación anterior si es necesario
