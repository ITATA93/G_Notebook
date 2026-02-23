<!-- File: docs/04_RUNBOOK_DESPLIEGUE.md -->
# Runbook de despliegue (MCP-first)

## Objetivo
Desplegar **NOs** en Notion de forma reproducible, idempotente y con verificación.

## Entradas
- Manifest: `manifests/nos.yaml`
- Acceso del agente a Notion MCP
- Permiso sobre la página raíz `NOs`

## Salidas
- Página raíz + dashboards creados
- 7 DBs creadas y conectadas
- Relaciones + rollup aplicados
- Seed de validación
- Reporte final

---

## Fase 0 — Discovery / Idempotencia
1. Buscar la página raíz por título exacto: `NOs`
   - Si existe: usarla.
   - Si no: crearla.
2. Para cada DB del manifest:
   - Buscar por título exacto (ej. `DB_MASTER_TASKS`)
   - Si existe: registrar URL/ID y detectar drift
   - Si no: marcar para creación

Regla: **nunca** crear duplicados; si hay conflicto, detener y reportar.

---

## Fase 1 — Crear páginas y DBs (sin relaciones)
3. Crear páginas hijas bajo la raíz:
   - COCKPIT
   - HOSPITAL & RESEARCH
   - SECOND BRAIN
   - SETUP & DOCS

4. Crear las 7 DBs bajo la raíz con propiedades primitivas (sin relaciones, sin rollups).

5. Registrar URLs/IDs resultantes.

---

## Fase 2 — Crear relaciones
6. Para cada relación declarada en el manifest:
   - Actualizar DB origen agregando propiedad relación hacia DB destino
   - Si es posible, definir “dual property name” en destino
7. Validación mínima:
   - crear 1 proyecto
   - crear 1 tarea y linkear tarea→proyecto
   - verificar el backlink (si aplica)

---

## Fase 3 — Crear rollups
8. Agregar rollup `Progreso (%)` en `DB_PROJECTS_AREAS` (si está en manifest).
9. Validación mínima:
   - marcar ✅ Done en una tarea
   - verificar % > 0 en el proyecto

---

## Fase 4 — Seed de validación
10. Crear registros seed con prefijo `[DEMO]`:
- Projects (3)
- Tasks (3)
- Knowledge (1)
- Surgical log (1, de-identificado)
- Finance (1)
- Metrics (1)

---

## Fase 5 — Dashboards (esqueleto)
11. Insertar headings + links + checklist “Manual finishing”.
12. No intentar “vistas filtradas avanzadas” si no están soportadas por el entorno.

---

## Reporte final
El agente debe devolver:
- URL de raíz y dashboards
- URL de cada DB
- Drift encontrado y cambios aplicados
- Manual finishing pendiente
- Riesgos detectados
