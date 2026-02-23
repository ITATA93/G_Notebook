<!-- File: docs/08_PRIVACIDAD_Y_SEGURIDAD_CLINICA.md -->
# Privacidad y seguridad clínica (silo)

## Objetivo
Permitir trazabilidad técnica (casos, procedimientos, complicaciones, bibliografía) sin almacenar información identificable.

## Clasificación de datos
- Nivel 0 (público): productividad general, tareas, proyectos no clínicos.
- Nivel 1 (interno): finanzas personales, métricas personales.
- Nivel 2 (sensible clínico de-identificado): DB_SURGICAL_LOG y evidencia vinculada.
- Nivel 3 (prohibido en Notion): PHI/PII identificable.

## Reglas de oro (cumplimiento operativo)
1. Nunca registrar nombre/RUT/dirección/teléfono/fecha nacimiento.
2. Usar ID anon: `CX-AAAA-NNN`.
3. Notas técnicas sin señas identificadoras.
4. PDFs o adjuntos: no adjuntar si contiene datos sensibles.

## Control de acceso
- Restringir DB_SURGICAL_LOG.
- Evitar compartir dashboards que puedan exponer contenido clínico.

## Auditoría práctica
- Revisión mensual: buscar términos prohibidos y revisar attachments.
