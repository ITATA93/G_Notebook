<!-- File: docs/06_CONFIG_GEMINI.md -->
# Configuración para Gemini (agente)

Este documento asume que usarás Gemini como agente en un entorno que:
- permita leer este repo (zip descomprimido)
- tenga conectores/herramientas para Notion (idealmente MCP)
- pueda ejecutar acciones (crear DBs/páginas) o al menos generar un plan ejecutable

## 1) Cargar el repo en el contexto del agente
- Sube el zip o pega los archivos relevantes.
- Indica al agente que la fuente de verdad es `manifests/nos.yaml`.

## 2) Conectar Notion
Si el entorno de Gemini soporta Notion MCP:
- Conecta el MCP server de Notion con OAuth.
- Verifica que el agente pueda buscar y crear páginas.

Si NO soporta MCP:
- Pide al agente que genere un plan manual paso a paso, basado en `docs/04_RUNBOOK_DESPLIEGUE.md`.

## 3) Ejecutar el deploy
- Usa el prompt `prompts/GEMINI_DEPLOY_PROMPT.md`
- Pega al final el YAML completo `manifests/nos.yaml`

## 4) Verificación
- Usa `docs/13_CHECKLIST_CALIDAD.md` para QA posterior.
- Completa “manual finishing” (vistas, permisos silo clínico).
