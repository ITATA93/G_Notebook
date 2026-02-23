<!-- File: docs/03B_SCHEMA_Y_MANIFEST.md -->
# Schema y manifest (declarativo)

## Objetivo
Mantener una “fuente de verdad” (YAML) para:
- DBs a crear
- propiedades y tipos
- opciones de selects/multiselect
- relaciones
- rollups

## Archivo oficial
- `manifests/nos.yaml`

## Convención de nombres
- DBs: `DB_*` (mayúsculas).
- Propiedades: español, legibles.
- Booleanos para métricas: prefijo “✅”.

## Estrategia anti-drift
- Si cambias el schema en Notion UI, actualiza el manifest.
- Registra decisiones relevantes en ADR (`docs/adr/`).
- Usa `prompts/GEMINI_REPAIR_PROMPT.md` para reconciliar drift.

## Nota sobre vistas
Las vistas filtradas (dashboards “bonitos”) pueden requerir “manual finishing” en UI.
