<!-- File: docs/13_CHECKLIST_CALIDAD.md -->
# Checklist de calidad (QA) — NOs

Usa esta checklist después de cada despliegue o cambio de schema.

## A. Estructura
- [ ] Existe la página raíz `NOs`
- [ ] Existen dashboards: COCKPIT, HOSPITAL & RESEARCH, SECOND BRAIN, SETUP & DOCS
- [ ] Existen las 7 DB_* bajo la raíz
- [ ] No existen DB duplicadas (ej. “DB_MASTER_TASKS (2)”)

## B. Propiedades críticas
### DB_MASTER_TASKS
- [ ] Tiene Fecha (date)
- [ ] Tiene Estado (select)
- [ ] Tiene ✅ Done (checkbox)
- [ ] Tiene Proyecto (relation) hacia DB_PROJECTS_AREAS
- [ ] Tiene Entidad/Activo (relation) hacia DB_ENTITIES_ASSETS

### DB_PROJECTS_AREAS
- [ ] Tiene Categoría / Dominio / Estado Proyecto
- [ ] Tiene rollup Progreso (%) (si aplica)

### DB_KNOWLEDGE_BASE
- [ ] Tiene Tipo, Tags, Estado, URL/Archivo
- [ ] Tiene relación a Proyecto
- [ ] Tiene relación a Caso Qx (opcional)

### DB_SURGICAL_LOG (silo)
- [ ] ID Caso con formato CX-AAAA-NNN
- [ ] No contiene datos identificables
- [ ] Permisos restringidos correctamente

## C. Relaciones (pruebas)
- [ ] Puedo crear Proyecto y linkear una Tarea
- [ ] Puedo linkear un Paper a un Proyecto
- [ ] Puedo linkear un Caso a un Paper (si se usa esa relación)
- [ ] Rollup de progreso se actualiza con ✅ Done

## D. Dashboards (operación)
- [ ] COCKPIT tiene vista “Hoy” (manual) o al menos link a DB_MASTER_TASKS
- [ ] SECOND BRAIN tiene inbox “Para Leer” (manual) o link a DB_KNOWLEDGE_BASE
- [ ] HOSPITAL & RESEARCH separa lo clínico con claridad

## E. Seguridad
- [ ] DB_SURGICAL_LOG no se comparte accidentalmente
- [ ] No hay attachments con PHI/PII
