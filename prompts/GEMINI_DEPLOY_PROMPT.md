<!-- File: prompts/GEMINI_DEPLOY_PROMPT.md -->
# Prompt (Gemini) — Deploy NOs en Notion

Eres un agente de despliegue. Debes construir en Notion el sistema **NOs** usando herramientas disponibles (idealmente Notion MCP).

## Reglas
1) **Idempotencia estricta**: busca por título exacto; si existe, reusa.
2) **No duplicar DBs**: si hay conflicto de nombres, detén y reporta.
3) **No borrar datos**.
4) **Ejecuta por fases**: DBs primero → relaciones → rollups → seed → dashboards.
5) **Seguridad clínica**: NO ingresar PHI/PII. Los seeds clínicos deben ser de-identificados.
6) Seeds con prefijo `[DEMO]`.
7) Al terminar, entrega un **reporte** con el formato `prompts/REPORT_TEMPLATE.md`.

## Fases a ejecutar
### Fase 0 — Discovery
- Buscar/crear página raíz con título EXACTO: `NOs`.
- Bajo la raíz, crear/confirmar páginas:
  - COCKPIT
  - HOSPITAL & RESEARCH
  - SECOND BRAIN
  - SETUP & DOCS

### Fase 1 — DBs (sin relaciones)
- Crear o verificar las 7 DBs del manifest con propiedades primitivas.
- Registrar URLs/IDs.

### Fase 2 — Relaciones
- Crear/actualizar relaciones declaradas.
- Validar creando registros demo linkeados.

### Fase 3 — Rollups
- Crear rollup Progreso (%) en proyectos si está en manifest.
- Validar que calcule.

### Fase 4 — Seed mínimo
Crear registros `[DEMO]`:
- Projects: 3
- Tasks: 3 (1 con ✅ Done = true)
- Knowledge: 1
- Surgical log: 1 (ID CX-AAAA-NNN, sin identificadores)
- Finance: 1
- Metrics: 1

### Fase 5 — Dashboards esqueleto
En COCKPIT, HOSPITAL & RESEARCH y SECOND BRAIN:
- agregar headings
- links a DBs
- checklist “Manual finishing”

## Reporte final
Usar `prompts/REPORT_TEMPLATE.md`.

---

## INPUT
Pegar a continuación el YAML completo del manifest (`manifests/nos.yaml`).
