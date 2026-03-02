---
title: Script Registry
version: "2.0"
last_updated: "2026-03-01"
---

# Script Registry — G_Notebook

Living dictionary of all scripts in this project. Every script, source module,
and test must be registered here with a meaningful description.

## Active Scripts

These are the production scripts used in day-to-day operations.

| Script | Path | Language | Description |
| --- | --- | --- | --- |
| `validate-manifest.ts` | `scripts/validate-manifest.ts` | TypeScript | Validates `manifests/nos.yaml` against `src/config.ts`. Checks DB key alignment, property types (`select`, `date`, etc.), and relation target existence. Exits non-zero on errors. |
| `backup-notion.ts` | `scripts/backup-notion.ts` | TypeScript | Exports all 12 Notion databases to JSON snapshots. Writes to `reports/backups/<ISO-timestamp>/`. Requires `NOTION_TOKEN` env var. Also copies `nos.yaml` and DB IDs into the backup. |

## Source Modules

Core application code under `src/`. Run via CLI (`npx tsx src/index.ts`) or npm scripts.

| Module | Path | Description |
| --- | --- | --- |
| `index.ts` | `src/index.ts` | Commander-based CLI entry point. Registers commands: `deploy`, `sync canvas`, `sync gmail`, `seed`, `diagnose`, `info`. Loads `.env` via dotenv. |
| `config.ts` | `src/config.ts` | Centralized configuration: 12 database UUIDs (`DB_IDS`), Notion API version and base URL, Canvas default URL, n8n base URL, rate limit constants, and file path constants. |
| `deploy.ts` | `src/core/deploy.ts` | Reads `nos.yaml` manifest, maps YAML property definitions to Notion API property format, updates database titles/icons/properties, and creates dual-property relations between databases. Supports `--dry-run` audit mode. |
| `setup.ts` | `src/core/setup.ts` | First-time installation script. Creates all 12 databases under a specified Notion parent page, then auto-patches `src/config.ts` with the new database IDs. |
| `seed.ts` | `src/core/seed.ts` | Populates the Notion workspace with seed data: 11 master areas, 31 subcategories, 14 projects, and 3 entities. Uses idempotent upsert logic (skips existing records by name). Supports `--dry-run`. |
| `templates.ts` | `src/core/templates.ts` | Defines Notion block templates for each database type: surgical protocols, daily journals, CRM person cards, project plans, academic programs, meeting notes, and financial transactions. |
| `canvas.ts` | `src/sync/canvas.ts` | Syncs Canvas LMS data to Notion. Fetches active courses and their assignments via paginated Canvas API, creates/updates records in `DB_CANVAS_COURSES` and `DB_MASTER_TASKS`. Deduplicates by external ID. Supports `--dry-run`. |
| `helpers.ts` | `src/utils/helpers.ts` | Shared utility functions: `retryWithBackoff()` with exponential backoff (default 3 retries), `sleep()`, `RateLimiter` class (enforces 3 req/s for Notion API), and `getAllDatabasePages()` with cursor-based pagination. |

## Tests

| Test | Path | Description |
| --- | --- | --- |
| `helpers.test.ts` | `tests/helpers.test.ts` | Vitest unit tests for `sleep()` timing accuracy and `retryWithBackoff()` retry-until-success behavior. |

## Infrastructure Scripts (Subagents)

Shell scripts for multi-agent orchestration.

| Script | Path | Description |
| --- | --- | --- |
| `deep-research.sh` | `.gemini/scripts/deep-research.sh` | Launches Gemini deep-research workflow for extended analysis tasks. |
| `parallel-agents.sh` | `.gemini/scripts/parallel-agents.sh` | Runs multiple Gemini agent instances in parallel for concurrent task processing. |
| `auto-memory.sh` | `.subagents/auto-memory.sh` | Automatic memory persistence for agent session state. |
| `dispatch.sh` | `.subagents/dispatch.sh` | Single sub-agent dispatch with vendor override support (gemini/claude/codex). |
| `dispatch-team.sh` | `.subagents/dispatch-team.sh` | Multi-agent team dispatch for pipeline tasks (analyst -> specialist -> reviewer). |
| `safe-write.sh` | `.subagents/safe-write.sh` | Safe file write wrapper with validation and backup before mutation. |

## Archived Scripts

Legacy scripts from migration phases. Located in `scripts/archive/`. These are
**not intended for regular use** but are preserved for reference.

| Script | Path | Description |
| --- | --- | --- |
| `add-missing-properties.ts` | `scripts/archive/add-missing-properties.ts` | One-time script to add missing properties to existing Notion databases during migration. |
| `analyze-bd-paginas.ts` | `scripts/archive/analyze-bd-paginas.ts` | Analyzes page counts and structure of Notion databases. |
| `analyze-config-complete.ts` | `scripts/archive/analyze-config-complete.ts` | Deep analysis of all configuration database properties. |
| `analyze-config-db.ts` | `scripts/archive/analyze-config-db.ts` | Inspects a single configuration database schema. |
| `analyze-config-deep.ts` | `scripts/archive/analyze-config-deep.ts` | Extended config analysis with property type validation. |
| `analyze-config-with-pagination.ts` | `scripts/archive/analyze-config-with-pagination.ts` | Config analysis with paginated data retrieval. |
| `analyze-overlaps.ts` | `scripts/archive/analyze-overlaps.ts` | Detects duplicate/overlapping entries across databases. |
| `analyze-schemas.ts` | `scripts/archive/analyze-schemas.ts` | Compares current Notion schemas against expected manifest. |
| `analyze-source-schemas.ts` | `scripts/archive/analyze-source-schemas.ts` | Analyzes source (legacy) database schemas before migration. |
| `analyze-tipos.ts` | `scripts/archive/analyze-tipos.ts` | Analyzes "Tipo" (type) property usage across databases. |
| `check-duplicates.ts` | `scripts/archive/check-duplicates.ts` | Finds duplicate entries by name within a database. |
| `check-knowledge-schema.ts` | `scripts/archive/check-knowledge-schema.ts` | Validates the Knowledge Base database schema. |
| `check-tasks-schema.ts` | `scripts/archive/check-tasks-schema.ts` | Validates the Master Tasks database schema. |
| `compare-schemas.ts` | `scripts/archive/compare-schemas.ts` | Side-by-side comparison of two database schemas. |
| `create-granular-infra.ts` | `scripts/archive/create-granular-infra.ts` | Creates granular infrastructure (sub-databases) v1. |
| `create-granular-infra-v3.ts` | `scripts/archive/create-granular-infra-v3.ts` | Creates granular infrastructure v3 (final iteration). |
| `create-subcategories.ts` | `scripts/archive/create-subcategories.ts` | One-time subcategory creation script. |
| `delete-incorrect-migrations.ts` | `scripts/archive/delete-incorrect-migrations.ts` | Cleans up incorrectly migrated entries. |
| `extract-legacy.ts` | `scripts/archive/extract-legacy.ts` | Extracts data from legacy Notion workspace for migration. |
| `find-config-databases.ts` | `scripts/archive/find-config-databases.ts` | Discovers configuration databases in Notion workspace. |
| `find-core-dbs.ts` | `scripts/archive/find-core-dbs.ts` | Locates core NOs databases by title pattern. |
| `find-libros-videos.ts` | `scripts/archive/find-libros-videos.ts` | Finds book and video entries across databases. |
| `find-parent-id.ts` | `scripts/archive/find-parent-id.ts` | Retrieves the parent page ID for a given database. |
| `find-root-page.ts` | `scripts/archive/find-root-page.ts` | Locates the NOs root page in the Notion workspace. |
| `fix-phase2-tasks.ts` | `scripts/archive/fix-phase2-tasks.ts` | Fixes data issues from Phase 2 task migration. |
| `get-complete-counts.ts` | `scripts/archive/get-complete-counts.ts` | Reports record counts per database. |
| `map-accessible-notion.ts` | `scripts/archive/map-accessible-notion.ts` | Maps all accessible pages/databases in the Notion workspace. |
| `map-all-databases.ts` | `scripts/archive/map-all-databases.ts` | Lists all databases with their IDs and titles. |
| `map-migration-entries.ts` | `scripts/archive/map-migration-entries.ts` | Maps entries that need migration between databases. |
| `migrate-library.ts` | `scripts/archive/migrate-library.ts` | Migrates Knowledge Base entries v1. |
| `migrate-library-v2.ts` | `scripts/archive/migrate-library-v2.ts` | Migrates Knowledge Base entries v2 (improved mapping). |
| `migrate-phase1.ts` | `scripts/archive/migrate-phase1.ts` | Phase 1 migration: core structure (Areas, Subcategories). |
| `migrate-phase2.ts` | `scripts/archive/migrate-phase2.ts` | Phase 2 migration: tasks and projects. |
| `migrate-phase3.ts` | `scripts/archive/migrate-phase3.ts` | Phase 3 migration: knowledge base and entities. |
| `migrate-videotheque-v2.ts` | `scripts/archive/migrate-videotheque-v2.ts` | Migrates video library entries to Knowledge Base. |
| `quick-setup.ts` | `scripts/archive/quick-setup.ts` | Quick setup script (superseded by `src/core/setup.ts`). |
| `search-all-databases.ts` | `scripts/archive/search-all-databases.ts` | Full-text search across all Notion databases. |
