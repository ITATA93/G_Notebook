# G_Notebook

> Satellite project in the Antigravity ecosystem.

**Domain:** `00_CORE`
**Status:** Active
**Orchestrator:** GEN_OS
**Prefix:** G_

## Proposito

Sistema operativo personal/profesional en Notion (NOs) con gestion unificada de
tareas, logging clinico de-identificado, y sincronizacion automatizada desde
Canvas LMS + Gmail/Outlook. Implementado en TypeScript para type safety y
alineacion con n8n.

## Arquitectura

```
G_Notebook/
  src/
    index.ts            # CLI unificado
    config.ts           # Configuracion type-safe
    core/               # Logica de negocio principal
    sync/               # Sincronizadores (Canvas, Email)
    utils/              # Helpers compartidos
  manifests/
    nos.yaml            # Schema de bases de datos (10 DBs, 84 props)
  scripts/              # Scripts de mantenimiento
  docs/                 # Documentacion y estandares
  assets/               # Recursos estaticos
  reports/              # Reportes generados
  logs/                 # Logs de ejecucion
  exports/              # Datos exportados
```

## Uso con Gemini CLI

```bash
# Iniciar sesion de desarrollo
gemini

# Analizar la arquitectura TypeScript
gemini -p "Analiza src/core/ y sugiere mejoras de tipo"

# Revisar sincronizadores
gemini -p "Review src/sync/ for error handling and retry logic"
```

## Scripts Disponibles

```bash
# Instalar dependencias
npm install

# Desplegar sistema NOs
npx tsx src/index.ts deploy <NOTION_TOKEN>

# Sincronizar desde Canvas
npx tsx src/index.ts sync canvas --canvas-token <TOKEN> --notion-token <TOKEN>

# Validar manifiesto
npx tsx scripts/validate-manifest.ts

# Dispatch de agente revisor
bash .subagents/dispatch.sh reviewer "Audit this project"

# Team workflow
bash .subagents/dispatch-team.sh code-and-review "Review recent changes"
```

## Configuracion

| Archivo | Proposito |
|---------|-----------|
| `GEMINI.md` | Instrucciones para Gemini CLI |
| `CLAUDE.md` | Instrucciones para Claude Code |
| `AGENTS.md` | Instrucciones para Codex CLI |
| `.gemini/settings.json` | Config de Gemini |
| `tsconfig.json` | Config de TypeScript |
| `package.json` | Dependencias y scripts npm |
| `manifests/nos.yaml` | Schema NOs (10 DBs, 84 props, 19 relations) |

## Estado

- **Production-Ready**: 10 databases, 84 properties, 19 relations
- **TypeScript Migration**: Completa (Core + Sync scripts)
- **Pendiente**: n8n API key para despliegue automatizado de workflows

## Contraparte AG

Migrado desde `AG_Notebook`. Misma funcionalidad NOs, infraestructura de
agentes actualizada al estandar G_ con soporte multi-vendor completo.

## Licencia

MIT
