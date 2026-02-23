# Legacy TypeScript scripts (root)

These standalone scripts are for one-off diagnostics/migrations and are **not** part of the main CLI.

- Now reside in `scripts/archive/` para evitar ejecuciones accidentales.
- Requieren env vars: copia `.env.example` -> `.env` y completa `NOTION_TOKEN` y los IDs correspondientes. No embebas credenciales en código.
- Ejecuta siempre con `DRY_RUN=true` primero (si no hay soporte de dry-run, trátalos como solo-lectura hasta agregarlo).
- Guarda salidas en `reports/` o `logs/` con timestamp para trazabilidad; nunca borres datos de producción.
