<!-- File: docs/07_DASHBOARDS_Y_VISTAS.md -->
# Dashboards y vistas (manual finishing)

El agente crea el **esqueleto**. Las vistas filtradas y linked databases se finalizan en Notion UI.

## COCKPIT
### Secciones
1. Hoy
2. Overdue
3. Next
4. Waiting
5. Proyectos activos
6. Registro rápido (métricas)

### Vistas sugeridas (DB_MASTER_TASKS)
- **Hoy**
  - Filtro: Fecha = Hoy AND Estado != Done
  - Orden: Prioridad, Fecha
- **Overdue**
  - Filtro: Fecha < Hoy AND Estado != Done
- **Next**
  - Filtro: Estado = Next
- **Waiting**
  - Filtro: Estado = Waiting

### Vistas sugeridas (DB_PROJECTS_AREAS)
- **Activos**
  - Filtro: Categoría = Proyecto Activo AND Estado Proyecto = En Curso

### Vistas sugeridas (DB_METRICS_LOG)
- **Últimos 7 días**
  - Orden: Fecha desc

## HOSPITAL & RESEARCH
- DB_SURGICAL_LOG: tabla por fecha desc
- DB_PROJECTS_AREAS: filtro Dominio = Hospital
- DB_KNOWLEDGE_BASE: filtro Tipo = Guía Clínica OR Normativa

## SECOND BRAIN
- DB_KNOWLEDGE_BASE:
  - Inbox: Estado = Para Leer
  - Leyendo: Estado = Leyendo
  - Archivado: Estado = Archivado
