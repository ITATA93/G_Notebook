# CLAUDE.md — G_Notebook

## Identity
This is the **G_Notebook** satellite project under the Antigravity ecosystem.
Domain: `00_CORE`

Notebook workspace con Node.js/TypeScript para documentacion interactiva

## Rules
1. Follow the governance standards defined in `docs/standards/`.
2. All scripts must be registered in `docs/library/scripts.md`.
3. Update CHANGELOG.md and DEVLOG.md with significant changes.
4. Cross-reference integrity: check `impacts:` frontmatter before finalizing edits.

## Regla de Consistencia Cruzada
Antes de finalizar cualquier edicion a un archivo que contenga frontmatter `impacts:`,
DEBES leer cada archivo listado en `impacts` y verificar que las referencias cruzadas
sigan siendo correctas. Si no lo son, corrigelas en el mismo commit/sesion.

## Project Structure
```
G_Notebook/
  .claude/          # Claude Code configuration
  .gemini/          # Gemini CLI configuration
  .codex/           # Codex CLI configuration
  .agent/           # Agent rules and workflows
  .subagents/       # Subagent manifest, dispatch, and skills
  docs/             # Documentation
    standards/      # Governance standards
    library/        # Living dictionary (scripts.md)
    research/       # Research artifacts
  manifests/        # YAML schema definition (nos.yaml)
  scripts/          # Automation & utility scripts
    archive/        # Legacy migration/analysis scripts
  src/              # Application source (TypeScript)
    core/           # Deployment, setup, seed, templates
    sync/           # External-source sync adapters (Canvas LMS)
    utils/          # Shared helpers (retry, rate-limit)
  tests/            # Vitest test suite
  config/           # Configuration files
  dist/             # Compiled JS output (gitignored)
```

## Architecture

### Overview
G_Notebook implements **NOs (Notion Operating System)** -- a TypeScript CLI that manages
a personal/professional workspace hosted entirely in Notion. The system handles 12
databases, 84+ properties, and 19+ inter-database relations defined in a single
YAML manifest (`manifests/nos.yaml`).

### Key Components

| Component | File(s) | Responsibility |
|-----------|---------|----------------|
| **CLI Entry Point** | `src/index.ts` | Commander-based CLI with commands: `deploy`, `sync canvas`, `sync gmail`, `seed`, `diagnose`, `info` |
| **Configuration** | `src/config.ts` | Centralized DB IDs (12 databases), API endpoints, rate limits, file paths |
| **Deploy Engine** | `src/core/deploy.ts` | Reads `nos.yaml` manifest, maps property types to Notion API format, updates DB schemas and creates dual-property relations |
| **Initial Setup** | `src/core/setup.ts` | First-time installation: creates all 12 databases under a Notion parent page, auto-updates `config.ts` with new IDs |
| **Seed Data** | `src/core/seed.ts` | Populates master areas (11), subcategories (31), projects (14), and entities (3) with idempotent upsert logic |
| **Page Templates** | `src/core/templates.ts` | Notion block templates for each database type (protocols, journals, CRM cards, etc.) |
| **Canvas Sync** | `src/sync/canvas.ts` | Bidirectional sync: Canvas LMS courses to `DB_CANVAS_COURSES`, assignments to `DB_MASTER_TASKS` with pagination and deduplication |
| **Helpers** | `src/utils/helpers.ts` | `retryWithBackoff()`, `RateLimiter` class (3 req/s for Notion API), `getAllDatabasePages()` with cursor pagination |
| **Manifest Validator** | `scripts/validate-manifest.ts` | Validates `nos.yaml` against `config.ts`: checks DB key alignment, property types, relation targets |
| **Notion Backup** | `scripts/backup-notion.ts` | Exports all 12 databases to JSON snapshots under `reports/backups/<timestamp>/` |

### Data Flow
```
nos.yaml (manifest)
    |
    v
[validate-manifest.ts] -- checks DB keys, property types, relation targets
    |
    v
[deploy.ts] -- reads manifest, pushes schema to Notion API
    |
    v
[seed.ts] -- populates Areas -> Subcategories -> Projects -> Entities
    |
    v
[canvas.ts] -- pulls courses/assignments from Canvas LMS, writes to Notion
    |
    v
[backup-notion.ts] -- snapshots all DB pages to local JSON
```

### Notion Database Schema (12 DBs)
1. `DB_AREAS` -- Master life/work areas (top-level hierarchy)
2. `DB_SUBCATEGORIES` -- Continuous work areas under each Area
3. `DB_PROJECTS` -- Time-bound objectives with Area relation
4. `DB_MASTER_TASKS` -- Unified task inbox (Canvas assignments, manual tasks)
5. `DB_KNOWLEDGE_BASE` -- Papers, guides, books, learning resources
6. `DB_ENTITIES_ASSETS` -- People (CRM), physical assets, institutions
7. `DB_FINANCE_LEDGER` -- Transactions, budgets, receipts
8. `DB_SURGICAL_LOG` -- De-identified surgical case log (PHI pipeline)
9. `DB_METRICS_LOG` -- Daily journaling and habit metrics
10. `DB_CANVAS_COURSES` -- Synced Canvas LMS course records
11. `DB_EMAILS` -- Synced email records (Gmail/Outlook)
12. `DB_MEETINGS_CLASSES` -- Events, shifts, classes

### Build & Run
```bash
npm run build          # tsc -> dist/
npm run dev            # tsx watch src/index.ts
npm run lint           # eslint src --ext .ts
npm run test           # vitest run
npm run validate:manifest  # validate nos.yaml
npm run backup:notion  # export all DBs to JSON
npm run deploy         # deploy schema to Notion
npm run sync:canvas    # sync Canvas LMS data
```
