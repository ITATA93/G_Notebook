# Archivos candidatos a limpieza (no borrar sin revisión)

- `nos.py` (CLI Python legacy; sustituido por TypeScript en `src/index.ts`).
- `dist/` (artefactos de build; regenerar con `npm run build`).
- `logs/` viejos y `reports/*.json` generados por scripts ad-hoc (revisar y archivar con timestamp si se conservan).
- `node_modules/` (reinstalable).
- Scripts en `scripts/archive/` una vez validados o migrados al CLI.
