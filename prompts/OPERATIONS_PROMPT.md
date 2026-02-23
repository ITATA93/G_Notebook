# OPERATIONS PROMPT (Antigravity → Gemini)

## Rol
- Antigravity: Arquitectura/plan y control de riesgos.
- Gemini (ejecutor): Aplica cambios en Notion siguiendo el plan, sin perder datos.

## Fuentes obligatorias
- `SYSTEM_INSTRUCTIONS.md`
- `project_memory.md`
- `prompts/GEMINI_*`
- `manifests/nos.yaml`

## Fases
1) Descubrimiento: leer `project_memory.md` y manifest, listar DBs/props/relaciones esperadas.
2) Dry-run: simular cambios, no escribir; registrar hallazgos y diffs esperados.
3) Apply: ejecutar con rate limit, sin borrar datos, idempotente.
4) Bitácora: registrar en `logs/run-<timestamp>.md` y en `execution_logs.md` (comando, opciones, IDs afectadas, errores).

## Reglas
- Nunca borrar datos de producción.
- Idempotencia: buscar por título/ID exacto antes de crear.
- Sin credenciales en código; usar env (`NOTION_TOKEN`, IDs).
- Reportar errores con contexto (DB, propiedad, código de error) en bitácora.

## Salida requerida
- Resumen de acciones ejecutadas, cambios aplicados/no aplicados, errores y próximos pasos.
