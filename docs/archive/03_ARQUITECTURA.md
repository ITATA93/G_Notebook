<!-- File: docs/03_ARQUITECTURA.md -->
# Arquitectura

## Topología (alto nivel)
El sistema **NOs** se compone de 7 bases de datos maestras (tablas) y dashboards de operación.

### Bases de datos maestras
1. **DB_MASTER_TASKS**: motor de acción (tareas/eventos/reuniones).
2. **DB_PROJECTS_AREAS**: jerarquía estratégica (proyectos/áreas).
3. **DB_KNOWLEDGE_BASE**: repositorio de conocimiento (papers, notas, guías).
4. **DB_ENTITIES_ASSETS**: CRM e inventario (personas, instituciones, activos).
5. **DB_FINANCE_LEDGER**: registro transaccional (ingresos/gastos).
6. **DB_SURGICAL_LOG**: silo clínico (de-identificado).
7. **DB_METRICS_LOG**: registro diario/hábitos.

### Dashboards
- **COCKPIT**: “Today/Next”, focos y captura rápida.
- **HOSPITAL & RESEARCH**: clínico + proyectos hospitalarios + guías.
- **SECOND BRAIN**: inbox de lectura + biblioteca.

## Modelo relacional (relaciones esenciales)
- Tasks → Projects (N:1)
- Tasks → Entities (N:1 opcional)
- Knowledge → Projects (N:1 opcional)
- Knowledge ↔ Surgical Log (relación explícita)
- Surgical Log → Projects (N:1 opcional)
- Finance → Projects (N:1 opcional)

## Separación clínica (silo)
**DB_SURGICAL_LOG** es sensible:
- no contiene identificadores personales
- acceso restringido por permisos en Notion
- se vincula a bibliografía solo en forma de-identificada

## Normalización mínima viable
- “Proyecto” y “Entidad” se guardan como registros canónicos (no texto repetido).
- Tareas referencian Proyecto/Entidad mediante relaciones.
- Knowledge referencia Proyecto/Caso mediante relaciones.

## Compatibilidad con despliegue automatizado
- Tipos de propiedades preferidos: title, select, multi_select, date, number, checkbox, url, files, rich_text.
- Rollups para progreso.
