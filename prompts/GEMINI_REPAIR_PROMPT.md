<!-- File: prompts/GEMINI_REPAIR_PROMPT.md -->
# Prompt (Gemini) — Repair / Drift para NOs

Objetivo: reconciliar el estado real en Notion con el manifest.

## Reglas
- No borrar datos.
- Agregar lo faltante.
- No eliminar propiedades extra (solo reportarlas).
- Si hay ambigüedad (DB duplicadas o nombres inconsistentes), detener y reportar.

## Flujo
1) Buscar página raíz `NOs`.
2) Buscar las DB_* por título exacto.
3) Para cada DB:
   - comparar propiedades vs manifest
   - agregar las faltantes
4) Crear relaciones faltantes.
5) Crear rollups faltantes.
6) QA mínimo:
   - crear 1 registro demo si es necesario para validar rollups
7) Reporte final con drift y acciones.

---

## INPUT
Pegar manifest YAML completo (`manifests/nos.yaml`).
