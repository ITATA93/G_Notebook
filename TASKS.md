# Task List - NOs Repository Hardening & Optimization

## 0) Auditoría y estado actual
- [x] Analizar archivos y estructura del repositorio (inventario).
- [x] Generar "estado actual": listado de archivos y su contenido/rol resumido.
- [x] Revisar el inventario y documentar hallazgos/observaciones.
- [x] Derivar tareas de optimización a partir del análisis (sin perder datos).

## 1) Seguridad y saneamiento
- [ ] Remover tokens embebidos y parametrizar scripts en `scripts/archive/` con `.env` (`NOTION_TOKEN`, IDs) y `DRY_RUN=true` por defecto.
- [ ] Añadir soporte de `DRY_RUN` donde falte; marcar scripts sin dry-run como solo-lectura hasta agregarlo (documentado en `scripts/archive/README.md`).
- [x] Ordenar root: mover scripts sueltos (`nos.py`, `quick-setup.ts`, `add-missing-properties.ts`) a `scripts/archive/` y consolidar artefactos en `reports/archive/root`.

## 2) Configuración consistente
- [x] Reparar encoding (acentos/emoji) en `manifests/nos.yaml`, `src/core/seed.ts`, `prompts/`.
- [x] Resolver claves inconsistentes (`DB_PROJECTS_AREAS` vs `src/config.ts`): alinear o crear entrada faltante.
- [x] Crear `scripts/validate-manifest.ts` que compare manifest vs `src/config.ts` (claves, relaciones, rollups, tipos soportados) y falle con drift o caracteres corruptos.

## 3) CLI robusto
- [x] Extraer cliente Notion a `src/services/notion.ts` con rate limit + retry + logger.
- [x] Añadir flags `--dry-run/--audit` a `deploy`, `seed`, `sync` en `src/index.ts`.
- [ ] Implementar o eliminar el comando Gmail para no dejar rutas rotas.
- [ ] Limpiar logs/salidas con encoding correcto.

## 4) Observabilidad y trazabilidad
- [x] Crear `src/utils/logger.ts` -> `logs/*.jsonl` con nivel, comando, IDs afectadas, error.
- [ ] Auto-appender de resumen por run en `execution_logs.md` y `logs/run-<timestamp>.md`.
- [ ] `reports/known-errors.md` para errores recurrentes y sus fixes.

## 5) Backups y operaciones seguras
- [x] Script `npm run backup:notion` (solo lectura) que exporte DBs a `reports/backups/<timestamp>/`.
- [ ] Política: ejecutar siempre en `--dry-run` antes de aplicar; nunca borrar datos.

## 6) Seeds y rollups idempotentes
- [x] Ajustar seeds tras limpieza de encoding; soportar rollups/títulos personalizados en deploy/seed para evitar duplicados.

## 7) Calidad y CI
- [x] Añadir ESLint config aplicada a `src/`.
- [x] Añadir tests (Jest/Vitest con mocks de Notion/Canvas).
- [ ] Pipeline CI: `type-check`, `lint`, `test`, smokes `nos info` y `nos diagnose --verbose`.

## 8) Gobernanza de agentes
- [x] Crear `prompts/OPERATIONS_PROMPT.md` que integre `SYSTEM_INSTRUCTIONS.md`, `project_memory.md` y prompts Gemini, con fases: descubrimiento → dry-run → apply + bitácora obligatoria.
