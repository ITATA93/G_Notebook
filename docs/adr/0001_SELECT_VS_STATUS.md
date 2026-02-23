<!-- File: docs/adr/0001_SELECT_VS_STATUS.md -->
# ADR 0001 — Select vs Status para estados

## Contexto
Se requiere un campo “Estado” para tareas y proyectos. En automatizaciones vía agentes/APIs, el tipo “Status” puede traer fricción (opciones no gestionables, drift, etc.).

## Decisión
Usar `Select` para “Estado” y un `Checkbox` separado (`✅ Done`) para:
- rollups de progreso (% completado)
- compatibilidad y estabilidad del despliegue automatizado

## Alternativas
1) Status nativo:
- Pros: UX nativa en Notion
- Contras: mayor fricción en automatización y mantenimiento

2) Fórmulas:
- Pros: automático
- Contras: complejidad y riesgo de drift

## Consecuencias
- Se puede convertir a Status manualmente en UI si se desea.
- El manifest se mantiene portable.
