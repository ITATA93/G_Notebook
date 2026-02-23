# Guía de Configuración n8n para NOs

## 🎯 Objetivo

Configurar workflows en n8n (<https://n8n.imedicina.cl/>) para automatizar la sincronización de:

1. Canvas LMS → Notion (DB_CANVAS_COURSES)
2. Gmail → Notion (DB_EMAILS)
3. Outlook → Notion (DB_EMAILS)

## 📋 Requisitos Previos

### 1. Acceso a n8n

- URL: <https://n8n.imedicina.cl/>
- Usuario y contraseña de tu instancia

### 2. Credenciales Necesarias

#### Notion API

- Token: `<NOTION_TOKEN_REDACTED>`
- Database IDs:
  - Canvas: `9eead739-3b6f-4c13-96f9-f36e5f427f16`
  - Emails: `bb296f80-1cb1-4e7c-80b8-e1b1defc06be`

#### Canvas API

- URL de tu institución (ej: `https://canvas.uc.cl`)
- Token de API (obtener desde Canvas Settings)

#### Gmail API

- Cuenta de Gmail
- OAuth 2.0 (n8n maneja la autenticación)

## 🚀 Paso 1: Configurar Credenciales en n8n

### 1.1 Notion API

1. En n8n, ve a **Settings** → **Credentials**
2. Click en **+ Add Credential**
3. Busca "Notion API"
4. Configura:
   - **Name**: `Notion NOs`
   - **API Key**: `<NOTION_TOKEN_REDACTED>`
5. Click **Save**

### 1.2 Gmail OAuth2

1. En Credentials, click **+ Add Credential**
2. Busca "Gmail OAuth2"
3. Configura:
   - **Name**: `Gmail Personal`
   - Sigue el flujo de OAuth (n8n te guiará)
   - Autoriza el acceso a tu cuenta de Gmail
4. Click **Save**

### 1.3 Canvas API (HTTP Header Auth)

1. En Credentials, click **+ Add Credential**
2. Busca "Header Auth"
3. Configura:
   - **Name**: `Canvas API`
   - **Name**: `Authorization`
   - **Value**: `Bearer TU_TOKEN_CANVAS`
4. Click **Save**

## 📥 Paso 2: Importar Workflows

### 2.1 Canvas → Notion

1. En n8n, ve a **Workflows**
2. Click en **+ Add Workflow**
3. Click en el menú **⋮** → **Import from File**
4. Selecciona `w:\GIT\NOs\n8n_workflows\canvas_to_notion.json`
5. Configura:
   - Nodo "Get Canvas Courses":
     - URL: `https://TU_CANVAS.cl/api/v1/courses`
     - Credentials: Selecciona "Canvas API"
   - Nodo "Create in Notion":
     - Credentials: Selecciona "Notion NOs"
6. Click **Save**
7. Click **Execute Workflow** para probar

### 2.2 Gmail → Notion

1. Click en **+ Add Workflow**
2. Import `w:\GIT\NOs\n8n_workflows\gmail_to_notion.json`
3. Configura:
   - Nodo "Gmail":
     - Credentials: Selecciona "Gmail Personal"
   - Nodo "Check if Exists":
     - Credentials: Selecciona "Notion NOs"
   - Nodo "Create in Notion":
     - Credentials: Selecciona "Notion NOs"
4. Click **Save**
5. Click **Execute Workflow** para probar

## ⚙️ Paso 3: Configurar Schedules

### Canvas Sync (Diario)

El workflow ya está configurado para ejecutarse cada 24 horas. Para ajustar:

1. Abre el workflow "Canvas → Notion Sync"
2. Click en el nodo "Schedule Trigger"
3. Ajusta la frecuencia si deseas (ej: cada 12 horas)
4. Click **Save**
5. **Activa** el workflow con el toggle en la esquina superior derecha

### Gmail Sync (Cada 30 minutos)

El workflow ya está configurado para ejecutarse cada 30 minutos. Para ajustar:

1. Abre el workflow "Gmail → Notion Sync"
2. Click en el nodo "Schedule Every 30 min"
3. Ajusta si deseas (ej: cada 15 minutos, cada hora)
4. Click **Save**
5. **Activa** el workflow

## 🔧 Paso 4: Workflows Adicionales (Opcional)

### 4.1 Outlook → Notion

Crear un workflow similar a Gmail:

1. Agrega credencial "Microsoft Outlook OAuth2"
2. Duplica el workflow de Gmail
3. Reemplaza el nodo "Gmail" por "Microsoft Outlook"
4. Ajusta los campos según la estructura de Outlook

### 4.2 Google Calendar → Meetings

Para sincronizar eventos de calendario a DB_MEETINGS_CLASSES:

1. Credencial: "Google Calendar OAuth2"
2. Trigger: "Google Calendar Trigger" (eventos nuevos)
3. Nodo Notion: Crear en DB_MEETINGS_CLASSES (`2976df6e-5beb-4d8a-ada1-abb7e81f6c87`)

## 📊 Paso 5: Monitoreo

### Ver Ejecuciones

1. En n8n, ve a **Executions**
2. Verás el historial de todas las ejecuciones
3. Click en cualquier ejecución para ver detalles
4. Revisa errores en rojo

### Logs

- n8n guarda logs automáticamente
- Puedes ver el output de cada nodo
- Útil para debugging

### Notificaciones de Errores (Opcional)

Configura un workflow que envíe notificaciones si hay errores:

1. Usa el nodo "Error Trigger"
2. Conecta a "Email" o "Telegram" o "Slack"
3. Recibirás alertas automáticas

## 🎨 Paso 6: Personalización Avanzada

### Filtros de Gmail

Edita el nodo Gmail para filtrar emails:

```javascript
// En el campo "Query"
after:{{$now.minus({days: 7}).toFormat('yyyy/MM/dd')}} 
-category:promotions 
-category:social
is:important
```

### Mapeo de Propiedades

Puedes agregar más propiedades en el nodo "Create in Notion":

```javascript
// Ejemplo: Extraer CC del email
{
  "key": "CC",
  "richTextValues": [
    {
      "textContent": "={{$json.cc || ''}}"
    }
  ]
}
```

### Transformación de Datos

Usa el nodo "Code" (JavaScript) para transformar datos:

```javascript
// Ejemplo: Parsear fecha de Canvas
const items = $input.all();
return items.map(item => {
  return {
    json: {
      ...item.json,
      formatted_date: new Date(item.json.created_at).toISOString().split('T')[0]
    }
  };
});
```

## 🔒 Seguridad

### Variables de Entorno

Para mayor seguridad, usa variables de entorno en n8n:

1. En el servidor WSL, edita `.env`:

```bash
CANVAS_URL=https://canvas.tu-institucion.cl
CANVAS_TOKEN=tu_token_aqui
NOTION_TOKEN=<NOTION_TOKEN_REDACTED>
```

1. En los workflows, usa:

```javascript
={{$env.CANVAS_TOKEN}}
={{$env.NOTION_TOKEN}}
```

### Backup de Workflows

Exporta tus workflows regularmente:

1. Workflow → Menu → Export
2. Guarda el JSON en `w:\GIT\NOs\n8n_workflows\`
3. Commit a Git

## 🐛 Troubleshooting

### Error: "Invalid API Key"

- Verifica que el token de Notion sea correcto
- Asegúrate de que la integración tenga acceso a las bases de datos

### Error: "Database not found"

- Verifica los Database IDs
- Asegúrate de que la integración esté compartida con las bases de datos

### Gmail: "Insufficient permissions"

- Re-autoriza la credencial de Gmail
- Asegúrate de dar permisos de lectura

### Canvas: "Unauthorized"

- Verifica que el token de Canvas no haya expirado
- Regenera el token si es necesario

### Workflow no se ejecuta automáticamente

- Verifica que el workflow esté **activado** (toggle verde)
- Revisa que el Schedule Trigger esté configurado correctamente

## 📚 Recursos

### Documentación n8n

- Notion Node: <https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.notion/>
- Gmail Node: <https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/>
- HTTP Request: <https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/>

### Comunidad

- n8n Community: <https://community.n8n.io/>
- n8n Discord: <https://discord.gg/n8n>

## 🎯 Próximos Pasos

1. **Hoy**: Importar y activar los 2 workflows básicos
2. **Esta semana**: Configurar filtros personalizados, agregar Outlook
3. **Próximo mes**: Agregar Calendar sync, crear dashboards de métricas

---

**Última actualización**: 2025-12-27  
**Versión**: 1.0  
**Instancia n8n**: <https://n8n.imedicina.cl/>
