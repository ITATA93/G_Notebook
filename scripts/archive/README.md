# Scripts archivados (ad-hoc)

Ubicación: `scripts/archive/`. Son scripts de análisis/migración fuera del CLI.

Reglas:
- Usan `process.env.NOTION_TOKEN` (reemplazado el token hardcodeado). Carga `.env` antes de usarlos.
- Ejecuta primero en modo seguro: si no tienen `DRY_RUN`, trátalos como solo lectura hasta agregarlo.
- Conserva salidas en `reports/` o `logs/` con timestamp; no borres datos de producción.
- Preferir el CLI TypeScript (`src/index.ts`) para operaciones normales.

Lista de scripts:
- analyze-*.ts (inventario/diagnóstico)
- check-*.ts (validaciones)
- compare-schemas.ts
- create-granular-infra*.ts
- create-subcategories.ts
- delete-incorrect-migrations.ts
- extract-legacy.ts
- find-*.ts / map-*.ts / search-all-databases.ts
- migrate-*.ts (migraciones legacy)
- fix-phase2-tasks.ts
- quick-setup.ts
- add-missing-properties.ts
- nos.py (CLI legacy Python)
