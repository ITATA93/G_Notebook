<!-- File: docs/12_ORGANIZACION_DEL_REPO.md -->
# Organización de carpetas del proyecto

## Objetivo
Mantener un repo claro, auditable y fácil de operar por un agente o por ti.

## Estructura

```text
NOs/
  README.md
  GEMINI.md
  CHANGELOG.md
  LICENSE
  .gitignore

  manifests/
    nos.yaml
    README.md

  prompts/
    README.md
    GEMINI_DEPLOY_PROMPT.md
    GEMINI_REPAIR_PROMPT.md
    GEMINI_SEED_PROMPT.md
    REPORT_TEMPLATE.md

  docs/
    00_INDEX.md
    01_INSTRUCCIONES_INICIALES.md
    02_VISION_Y_ALCANCE.md
    03_ARQUITECTURA.md
    03B_SCHEMA_Y_MANIFEST.md
    04_RUNBOOK_DESPLIEGUE.md
    05_CONFIG_NOTION.md
    06_CONFIG_GEMINI.md
    07_DASHBOARDS_Y_VISTAS.md
    08_PRIVACIDAD_Y_SEGURIDAD_CLINICA.md
    09_OPERACION_Y_MANTENIMIENTO.md
    10_TROUBLESHOOTING.md
    11_CONVENCIONES_Y_TAXONOMIA.md
    13_CHECKLIST_CALIDAD.md
    14_MIGRACIONES_SCHEMA.md
    15_MODELO_DE_DATOS_NOTION.md
    16_ERD_MERMAID.md
    adr/
      README.md
      0001_SELECT_VS_STATUS.md
    templates/
      README.md
      TEMPLATE_PROYECTO.md
      TEMPLATE_REUNION.md
      TEMPLATE_PAPER.md
      TEMPLATE_CASO_QX.md

  assets/
    diagrams/
      erd.mmd

  logs/
    .gitkeep
```

## Qué va en cada carpeta
- `manifests/`: fuente de verdad del schema.
- `prompts/`: prompts listos para usar con agentes.
- `docs/`: especificación y guías.
- `docs/adr/`: decisiones arquitectónicas.
- `docs/templates/`: plantillas de páginas.
- `assets/`: diagramas y anexos.
- `logs/`: reportes de ejecución (si los guardas).
