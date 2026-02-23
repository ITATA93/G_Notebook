# Instrucciones Rápidas para Despliegue

## Paso 1: Crear la página raíz en Notion

1. Abre Notion en tu navegador
2. Crea una nueva página con el título exacto: **NOs**
3. Invita a tu integración a esta página:
   - Haz clic en los tres puntos (⋯) en la esquina superior derecha
   - Selecciona "Add connections" o "Agregar conexiones"
   - Busca y selecciona tu integración

## Paso 2: Ejecutar el script de despliegue

Una vez que hayas creado y compartido la página, ejecuta:

```bash
python scripts/deploy_nos.py <NOTION_TOKEN_REDACTED>
```

## ¿Qué hará el script?

El script automáticamente:

- ✅ Encontrará la página raíz "NOs"
- ✅ Creará 4 sub-páginas (COCKPIT, HOSPITAL & RESEARCH, SECOND BRAIN, SETUP & DOCS)
- ✅ Creará 7 bases de datos con todas sus propiedades
- ✅ Establecerá relaciones entre las bases de datos
- ✅ Creará rollups (Progreso %)
- ✅ Insertará datos de demostración con prefijo [DEMO]
- ✅ Generará un reporte de ejecución

## Solución de problemas

Si el script falla:

1. Verifica que la página se llame exactamente "NOs" (mayúsculas y minúsculas importan)
2. Confirma que la integración tiene acceso a la página
3. Revisa el archivo `report_execution.md` para más detalles
