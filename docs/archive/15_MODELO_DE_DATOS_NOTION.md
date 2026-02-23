<!-- File: docs/15_MODELO_DE_DATOS_NOTION.md -->
# Modelo de datos en Notion (explicación práctica para NOs)

Este documento explica **cómo se organiza el modelo de datos en Notion** y cómo **NOs** se mapea a esos conceptos.

---

## 1) Cómo “piensa” Notion los datos

### 1.1 Database = tabla (contenedor de registros)
En Notion, una **Database** se comporta como una tabla:
- **cada fila** es un **registro**
- cada registro es técnicamente una **página** (con contenido dentro)
- **cada columna** es una **propiedad** (Property)

### 1.2 Page = registro + contenido
Un registro de database tiene:
- **propiedades** (estructura)
- **cuerpo de página** (contenido libre: texto, checklists, bloques)

En NOs, aprovechamos esto:
- el “backend” vive en propiedades
- el “frontend” vive en dashboards y en el cuerpo de ciertas páginas (plantillas)

### 1.3 Properties = columnas tipadas
Tipos usados en NOs:
- **Title**: identificador humano del registro
- **Select / Multi-select**: clasificación y estados
- **Date**: fechas de eventos, timelines, etc.
- **Checkbox**: booleanos (útil para rollups, por ejemplo ✅ Done)
- **Number**: montos, tiempos quirúrgicos, etc.
- **URL / Files**: referencias y adjuntos
- **Relation**: “foreign keys” entre tablas
- **Rollup**: agregaciones sobre relaciones (por ejemplo progreso de proyecto)

### 1.4 Relation = llave foránea (FK)
Una **Relation** vincula registros entre bases de datos.
Ejemplo:
- En `DB_MASTER_TASKS`, la propiedad **Proyecto** relaciona cada tarea con un registro de `DB_PROJECTS_AREAS`.

Esto permite:
- ver todas las tareas desde la página del proyecto (backlink)
- filtrar tareas por proyecto sin duplicar texto

### 1.5 Rollup = agregación (SUM/COUNT/%)
Un **Rollup** calcula valores a partir de una relación.
Ejemplo:
- En `DB_PROJECTS_AREAS`, el rollup **Progreso (%)** calcula el porcentaje de tareas con ✅ Done.

---

## 2) NOs como modelo relacional (normalización)

NOs separa los dominios para evitar duplicación:

- **Proyectos/Áreas** = contenedores de esfuerzo (estrategia)
- **Tareas** = acciones/operación (ejecución)
- **Knowledge** = evidencias y notas (conocimiento)
- **Entities/Assets** = personas/activos/instituciones (CRM)
- **Finance** = transacciones (ledger)
- **Metrics** = registro diario (hábitos)
- **Surgical Log** = dominio clínico de-identificado (silo)

La regla de normalización:
> Si algo “tiene identidad” (proyecto, persona, activo, caso), debe ser un registro propio y ser referenciado por relación.

---

## 3) Diccionario de datos resumido (por DB)

## 3.1 DB_PROJECTS_AREAS
**Rol:** estrategia (proyectos/áreas).
- Nombre (title)
- Categoría (select): Área / Proyecto Activo / Someday
- Dominio (select): Hospital / Academia / Personal / Negocios
- Estado Proyecto (select)
- Timeline (date)
- Progreso (%) (rollup) ← desde tareas ✅ Done

## 3.2 DB_MASTER_TASKS
**Rol:** ejecución (acciones/eventos).
- Nombre (title)
- Fecha (date)
- Estado (select)
- ✅ Done (checkbox)
- Tipo / Prioridad / Esfuerzo (select)
- Proyecto (relation → DB_PROJECTS_AREAS)
- Entidad/Activo (relation → DB_ENTITIES_ASSETS)

## 3.3 DB_KNOWLEDGE_BASE
**Rol:** conocimiento (papers/guías/snippets/notas).
- Nombre (title)
- Tipo / Estado (select)
- Tags (multi-select)
- URL / Archivo
- Resumen (rich text)
- Proyecto (relation → DB_PROJECTS_AREAS)
- Caso Qx (relation → DB_SURGICAL_LOG) (opcional)

## 3.4 DB_ENTITIES_ASSETS
**Rol:** CRM / inventario.
- Nombre (title)
- Tipo (select)
- Datos Clave / Notas (rich text)
- Backlinks: tareas relacionadas vía relation desde tasks

## 3.5 DB_FINANCE_LEDGER
**Rol:** finanzas (transacciones).
- Concepto (title)
- Monto (number)
- Tipo (select): Ingreso/Gasto
- Categoría (select)
- Fecha (date)
- Centro de costos / Proyecto (relation → DB_PROJECTS_AREAS) (si se usa)

## 3.6 DB_SURGICAL_LOG (SILO)
**Rol:** log clínico de-identificado.
- ID Caso (title) — formato CX-AAAA-NNN
- Fecha, Procedimiento, Rol, Clasificación, Complicaciones, Tiempo Qx, Notas técnicas
- Proyecto (relation → DB_PROJECTS_AREAS) (opcional)
- Bibliografía (relation → DB_KNOWLEDGE_BASE)

## 3.7 DB_METRICS_LOG
**Rol:** quantified self.
- Fecha
- hábitos (checkbox)
- números (peso, sueño)
- rating (select)
- journal

---

## 4) Cómo se usa en Notion (operación)

### 4.1 Punto de entrada: COCKPIT
- Desde COCKPIT trabajas tu “Today/Next/Waiting”.
- Allí se consume `DB_MASTER_TASKS` (vista filtrada) y `DB_PROJECTS_AREAS`.

### 4.2 Navegación por relaciones
- Abres un proyecto → ves tareas relacionadas automáticamente.
- Abres un caso quirúrgico → ves bibliografía y notas relacionadas.

### 4.3 Vistas (Frontend)
En Notion, las “views” son tu UI:
- tabla para operación
- board para estado
- gallery para proyectos
- calendarios para eventos

NOs recomienda:
- mantener las DB maestras “limpias”
- y crear vistas derivadas (filtradas) en dashboards

---

## 5) Silo clínico (seguridad)
DB_SURGICAL_LOG requiere:
- permisos estrictos
- contenido de-identificado
- cuidado con adjuntos

Ver: `docs/08_PRIVACIDAD_Y_SEGURIDAD_CLINICA.md`
