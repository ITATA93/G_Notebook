# Guía de Configuración de Integraciones - NOs

## 📚 Canvas LMS Sync

### Requisitos

```bash
pip install canvasapi
```

### Configuración

1. **Obtener Token de Canvas API**:
   - Inicia sesión en Canvas
   - Ve a Account → Settings

> [!IMPORTANT]
> **Producción vs Prototipo**:
> Los scripts Python (`scripts/*_unified.py`) documentan la **lógica exacta** de mapeo y sirven para validación rápida.
> Para el entorno de producción, esta misma lógica debe ser implementada en **n8n** (Ver `GUIA_N8N.md`).

## 1. Integración Canvas LMS (Unified)

### Lógica de Sincronización (Referencia para n8n)

El script `scripts/canvas_sync_unified.py` implementa la siguiente lógica que debe replicarse en n8n:

1. **Autenticación**: Token Bearer.
2. **Assignments**: Se mapean a `DB_MASTER_TASKS`.
   - `External ID` -> `ID_Evento_Tarea` (Mapeo Unificado)
   - `Course ID` -> Relación con `DB_CANVAS_COURSES`.

### 1. Canvas LMS (Unified Sync)

Este script sincroniza:

1. **Cursos** → `DB_CANVAS_COURSES` (Información base)
2. **Assignments** → `DB_MASTER_TASKS` (Tareas centralizadas)

```bash
# Ejecución manual
python scripts/canvas_sync_unified.py <CANVAS_TOKEN> <NOTION_TOKEN>
```

#### Parámetros

- `CANVAS_TOKEN`: Generar en Canvas > Account > Settings > New Access Token
- `URL`: Configurable en variable de entorno `CANVAS_URL` (default: <https://canvas.instructure.com>)

---

## 📧 Gmail Sync

### Requisitos

```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### Configuración

1. **Crear Proyecto en Google Cloud**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente
   - Nombre sugerido: "NOs Gmail Sync"

2. **Habilitar Gmail API**:
   - En el menú lateral: APIs & Services → Library
   - Busca "Gmail API"
   - Click en "Enable"

3. **Crear Credenciales OAuth 2.0**:
   - APIs & Services → Credentials
   - Click en "+ CREATE CREDENTIALS" → OAuth client ID
   - Application type: "Desktop app"
   - Name: "NOs Desktop Client"
   - Click "Create"
   - **Descarga el JSON** y guárdalo como `credentials.json` en `w:\GIT\NOs\`

4. **Primera Ejecución (Autenticación)**:

```bash
cd w:\GIT\NOs
python scripts/gmail_sync.py <NOTION_TOKEN_REDACTED>
```

- Se abrirá un navegador para autenticación
- Inicia sesión con tu cuenta de Gmail
- Autoriza la aplicación
- Se creará `token.json` automáticamente

1. **Ejecuciones Posteriores**:

```bash
# Ya no requiere autenticación, usa token.json
python scripts/gmail_sync.py <NOTION_TOKEN_REDACTED>
```

1. **Configurar Múltiples Cuentas**:
   - Crea carpetas separadas para cada cuenta:

```bash
mkdir gmail_personal gmail_institucional
cp scripts/gmail_sync.py gmail_personal/
cp scripts/gmail_sync.py gmail_institucional/
```

- Ejecuta cada una por separado para generar tokens independientes

1. **Automatizar (Opcional)**:

```bash
# Sync cada 30 minutos
*/30 * * * * cd /path/to/NOs && python scripts/gmail_sync.py
```

### Configuración Avanzada

Edita `gmail_sync.py` para ajustar:

- `DAYS_TO_SYNC = 30`: Días hacia atrás para sincronizar
- `MAX_EMAILS = 100`: Máximo de emails por ejecución
- `query`: Filtros de búsqueda (ej: `'is:unread after:2024/01/01'`)

---

## 🔒 Seguridad y Privacidad

### Tokens y Credenciales

- **NO** subas `credentials.json` ni `token.json` a Git
- Agrega a `.gitignore`:

```
credentials.json
token.json
*.json
```

### Privacidad de Emails

- Los emails se almacenan en Notion (no E2E encrypted)
- Considera filtrar emails sensibles
- Usa filtros de Gmail para excluir categorías:

```python
query = 'after:2024/01/01 -category:promotions -category:social'
```

### Rate Limits

- **Gmail API**: 250 cuotas/segundo (generoso)
- **Canvas API**: Varía por institución (típicamente 3000 req/hora)
- **Notion API**: 3 requests/segundo

---

## 🛠️ Troubleshooting

### Canvas Sync

**Error: "Invalid access token"**

- Verifica que el token no haya expirado
- Regenera el token en Canvas Settings

**Error: "Course not found"**

- Verifica que estés inscrito en el curso
- Verifica que el curso esté activo

### Gmail Sync

**Error: "credentials.json not found"**

- Descarga las credenciales de Google Cloud Console
- Colócalas en el directorio raíz del proyecto

**Error: "Access denied"**

- Revisa los scopes en Google Cloud Console
- Asegúrate de haber autorizado `gmail.readonly`

**Error: "Quota exceeded"**

- Reduce `MAX_EMAILS`
- Aumenta el intervalo de sincronización

---

## 📊 Monitoreo

### Logs

Redirige la salida a un archivo de log:

```bash
python scripts/gmail_sync.py >> logs/gmail_sync.log 2>&1
python scripts/canvas_sync.py >> logs/canvas_sync.log 2>&1
```

### Verificación

Revisa las bases de datos en Notion:

- Canvas: <https://www.notion.so/9eead7393b6f4c1396f9f36e5f427f16>
- Emails: <https://www.notion.so/bb296f801cb14e7c80b8e1b1defc06be>

---

## 🚀 Próximos Pasos

1. **Outlook Sync** (Pendiente):
   - Requiere Microsoft Graph API
   - Similar a Gmail pero con Azure AD

2. **Calendar Sync** (Opcional):
   - Sincronizar Google Calendar → DB_MEETINGS_CLASSES
   - Usar Google Calendar API

3. **Webhooks** (Avanzado):
   - Recibir notificaciones en tiempo real
   - Requiere servidor público

---

**Última actualización**: 2025-12-27  
**Versión**: 1.0
