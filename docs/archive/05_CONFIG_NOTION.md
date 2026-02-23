<!-- File: docs/05_CONFIG_NOTION.md -->
# Configuración en Notion (preparación)

## 1) Página raíz
Crea una página con título exacto: `NOs`

Opcional:
- descripción breve: “Notion Operating System. DB relacionales. Silo clínico de-identificado.”

## 2) Permisos del agente/integración
Asegura que el agente:
- pueda ver la página raíz
- pueda crear páginas dentro
- pueda crear bases de datos
- pueda editar propiedades del schema

## 3) Permisos del silo clínico (post-despliegue)
Después del deploy:
- restringe `DB_SURGICAL_LOG`
- revisa qué dashboards o páginas se comparten externamente
- evita que DB clínica quede expuesta por enlaces o páginas compartidas

## 4) Política clínica: de-identificación
Reglas auditables:
- ID Caso: `CX-AAAA-NNN` (ej. CX-2025-001)
- Prohibido incluir: nombre, RUT/ID, fecha nacimiento, dirección, teléfono, fotos identificables
- Solo registrar: procedimiento, rol, tiempos, complicaciones, notas técnicas sin identificadores
