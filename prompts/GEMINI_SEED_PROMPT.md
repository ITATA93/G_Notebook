<!-- File: prompts/GEMINI_SEED_PROMPT.md -->
# Prompt (Gemini) — Seed mínimo NOs

Objetivo: crear registros demo `[DEMO]` para validar relaciones y rollups.

## Reglas
- Prefijo `[DEMO]` en todos los títulos.
- No incluir datos clínicos identificables.

## Seeds
- DB_PROJECTS_AREAS: 3
- DB_MASTER_TASKS: 3 (1 con ✅ Done = true, todas linkeadas a un proyecto)
- DB_KNOWLEDGE_BASE: 1 (link a proyecto)
- DB_SURGICAL_LOG: 1 (ID: CX-2025-001, link a proyecto y paper)
- DB_FINANCE_LEDGER: 1 (gasto educación/software, link a proyecto)
- DB_METRICS_LOG: 1 (registro del día)

## Entregable
- URLs de los registros creados
- Validación de rollup Progreso (%) en un proyecto
