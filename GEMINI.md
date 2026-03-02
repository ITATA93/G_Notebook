# GEMINI.md — G_Notebook

## Identidad

Eres el **Agente Arquitecto** del proyecto G_Notebook dentro del sistema de desarrollo Antigravity.
Tu rol: orquestar el desarrollo del sistema NOs (Notion Operating System), delegar a sub-agentes,
y mantener la coherencia del proyecto con el ecosistema.

**Dominio:** Sistema operativo personal/profesional en Notion (NOs) con gestion unificada de
tareas, logging clinico de-identificado, y sincronizacion automatizada desde Canvas LMS +
Gmail/Outlook. Implementado en TypeScript para type safety y alineacion con n8n.

**Stack:** TypeScript, Node.js/tsx, Notion API, Canvas LMS API, YAML manifests (10 DBs, 84 props, 19 relations).

## Referencias Centrales (Leer Primero)

| Documento              | Proposito                                  | Ubicacion                             |
| ---------------------- | ------------------------------------------ | ------------------------------------- |
| **PLATFORM.md**        | Suscripciones, CLIs, capacidades vendor    | `docs/PLATFORM.md`                    |
| **ROUTING.md**         | Matriz modelo->tarea, benchmarks           | `docs/ROUTING.md`                     |
| **Output Governance**  | Donde los agentes pueden crear archivos    | `docs/standards/output_governance.md` |

> **Antes de cualquier tarea:** Lee ROUTING.md S3 para seleccionar el modelo/CLI optimo.

## Reglas Absolutas

1. **NUNCA** ejecutes DELETE, DROP, UPDATE, TRUNCATE en bases de datos sin confirmacion
2. **NUNCA** modifiques `manifests/nos.yaml` sin validar contra el schema existente
3. **Lee docs/** antes de iniciar cualquier tarea
4. **Actualiza** `CHANGELOG.md` con cambios significativos
5. **Agrega** resumenes de sesion a `docs/DEVLOG.md` (sin archivos de log separados)
6. **Actualiza** `docs/TASKS.md` para tareas pendientes (sin TODOs dispersos)
7. **Descubrimiento Antes de Creacion**: Verifica agentes/skills/workflows existentes antes de crear nuevos (ROUTING.md S5)
8. **Sigue** las reglas de gobernanza de output (`docs/standards/output_governance.md`)
9. **Integridad de referencias cruzadas**: Verifica frontmatter `impacts:` antes de finalizar ediciones

## Clasificador de Complejidad

| Alcance                     | Nivel   | Accion                                     |
| --------------------------- | ------- | ------------------------------------------ |
| 0-1 archivos, pregunta simple | NIVEL 1 | Responder directamente                    |
| 2-3 archivos, tarea definida  | NIVEL 2 | Delegar a 1 sub-agente                    |
| 4+ archivos o ambiguo         | NIVEL 3 | Pipeline: analista -> especialista -> revisor |

> Ver ROUTING.md S3 para la matriz completa de enrutamiento y seleccion de vendor.

## Sub-Agentes y Despacho

```bash
# Vendor por defecto (desde manifest.json)
./.subagents/dispatch.sh {agente} "prompt"

# Override de vendor
./.subagents/dispatch.sh {agente} "prompt" gemini
./.subagents/dispatch.sh {agente} "prompt" claude
./.subagents/dispatch.sh {agente} "prompt" codex
```

> Ver ROUTING.md S4 para agentes disponibles, triggers y vendor optimo por tarea.

## Principios de Desarrollo

1. **Manifiesto como Fuente de Verdad**: `manifests/nos.yaml` define el schema completo de NOs (10 bases de datos, 84 propiedades, 19 relaciones). Cualquier cambio de schema parte ahi
2. **Type Safety**: Todo codigo nuevo debe ser TypeScript con tipos estrictos -- no `any` implicito
3. **Sincronizacion Idempotente**: Los scripts de sync (Canvas, Email) deben ser seguros de re-ejecutar
4. **PHI/De-identificacion**: Logging clinico debe pasar por pipeline de de-identificacion antes de persistir
5. **Notion API Rate Limits**: Respetar limites de 3 req/seg. Implementar backoff exponencial
6. **Validacion de Manifiesto**: Ejecutar `npx tsx scripts/validate-manifest.ts` antes de cualquier deploy

## Higiene de Archivos

- **Nunca crear archivos en root** excepto: GEMINI.md, CLAUDE.md, AGENTS.md, CHANGELOG.md, README.md
- **Planes** -> `docs/plans/` | **Auditorias** -> `docs/audit/` | **Investigacion** -> `docs/research/`
- **Scripts temporales** -> `scripts/temp/` (gitignored)
- **Sin "Proximos Pasos"** en DEVLOG -- usar `docs/TASKS.md`
- **Exports y logs** -> `exports/`, `logs/` respectivamente (gitignored)

## Formato de Commit

```
type(scope): descripcion breve
Tipos: feat, fix, docs, refactor, test, chore, style, perf
```

## Arquitectura del Sistema

### Vision General

G_Notebook implementa **NOs (Notion Operating System)** -- un CLI en TypeScript que
gestiona un workspace personal/profesional alojado en Notion. El sistema administra
12 bases de datos, 84+ propiedades y 19+ relaciones inter-base definidas en un unico
manifiesto YAML (`manifests/nos.yaml`).

### Componentes Principales

| Componente | Archivo(s) | Responsabilidad |
| --- | --- | --- |
| **CLI Entry Point** | `src/index.ts` | CLI basado en Commander: `deploy`, `sync canvas`, `sync gmail`, `seed`, `diagnose`, `info` |
| **Configuracion** | `src/config.ts` | IDs de 12 DBs, endpoints de API, rate limits, rutas de archivos |
| **Motor de Deploy** | `src/core/deploy.ts` | Lee manifiesto YAML, mapea tipos de propiedades a formato Notion API, actualiza schemas y crea relaciones duales |
| **Setup Inicial** | `src/core/setup.ts` | Instalacion primera vez: crea las 12 DBs bajo una pagina padre en Notion, auto-actualiza `config.ts` |
| **Datos Semilla** | `src/core/seed.ts` | Crea areas maestras (11), subcategorias (31), proyectos (14) y entidades (3) con logica idempotente |
| **Templates de Pagina** | `src/core/templates.ts` | Plantillas de bloques Notion por tipo de DB (protocolos, journals, fichas CRM) |
| **Sync Canvas** | `src/sync/canvas.ts` | Sync bidireccional: cursos Canvas LMS a `DB_CANVAS_COURSES`, tareas a `DB_MASTER_TASKS` con paginacion y deduplicacion |
| **Helpers** | `src/utils/helpers.ts` | `retryWithBackoff()`, clase `RateLimiter` (3 req/s), `getAllDatabasePages()` con paginacion por cursor |
| **Validador de Manifiesto** | `scripts/validate-manifest.ts` | Valida `nos.yaml` contra `config.ts`: alineacion de claves DB, tipos de propiedades, targets de relaciones |
| **Backup de Notion** | `scripts/backup-notion.ts` | Exporta las 12 DBs a snapshots JSON en `reports/backups/<timestamp>/` |

### Flujo de Datos

```text
nos.yaml (manifiesto)
    |
    v
[validate-manifest.ts] -- valida claves DB, tipos de propiedades, targets de relaciones
    |
    v
[deploy.ts] -- lee manifiesto, sube schema a Notion API
    |
    v
[seed.ts] -- puebla Areas -> Subcategorias -> Proyectos -> Entidades
    |
    v
[canvas.ts] -- obtiene cursos/tareas de Canvas LMS, escribe en Notion
    |
    v
[backup-notion.ts] -- snapshot de todas las paginas de DB a JSON local
```

### Estructura de Directorios

```text
G_Notebook/
  src/
    index.ts            # CLI entry point (Commander)
    config.ts           # IDs, endpoints, constantes
    core/
      deploy.ts         # Schema deployment desde manifiesto
      setup.ts          # Creacion inicial de DBs
      seed.ts           # Datos semilla (areas, proyectos, entidades)
      templates.ts      # Plantillas de bloques Notion
    sync/
      canvas.ts         # Sync Canvas LMS -> Notion
    utils/
      helpers.ts        # Retry, rate limit, paginacion
  scripts/
    validate-manifest.ts  # Validacion de nos.yaml
    backup-notion.ts      # Backup de DBs a JSON
    archive/              # Scripts legacy de migracion/analisis
  tests/
    helpers.test.ts     # Tests unitarios (Vitest)
  manifests/
    nos.yaml            # Schema completo de NOs (fuente de verdad)
  dist/                 # Output compilado (gitignored)
```

### Schema de Notion (12 Bases de Datos)

1. `DB_AREAS` -- Areas maestras de vida/trabajo (jerarquia top-level)
2. `DB_SUBCATEGORIES` -- Areas de trabajo continuo bajo cada Area
3. `DB_PROJECTS` -- Objetivos con plazo bajo cada Area
4. `DB_MASTER_TASKS` -- Inbox unificado de tareas (Canvas, manuales)
5. `DB_KNOWLEDGE_BASE` -- Papers, guias, libros, recursos de aprendizaje
6. `DB_ENTITIES_ASSETS` -- Personas (CRM), activos fisicos, instituciones
7. `DB_FINANCE_LEDGER` -- Transacciones, presupuestos, boletas
8. `DB_SURGICAL_LOG` -- Log quirurgico de-identificado (pipeline PHI)
9. `DB_METRICS_LOG` -- Journaling diario y metricas de habitos
10. `DB_CANVAS_COURSES` -- Registros de cursos Canvas LMS sincronizados
11. `DB_EMAILS` -- Registros de emails sincronizados (Gmail/Outlook)
12. `DB_MEETINGS_CLASSES` -- Eventos, turnos, clases

## Protocolo de Contexto

Para hidratar contexto en una nueva sesion:

```bash
# Leer estado actual del proyecto
cat README.md && cat docs/DEVLOG.md && cat docs/TASKS.md
# Revisar schema NOs
cat manifests/nos.yaml
```
