# 🤖 WhatsApp Outreach Bot

> Sistema automatizado de captación de clientes con n8n + Evolution API + Claude AI  
> **Autor:** Alfonsito | **Stack:** Docker · n8n · Evolution API · Claude AI · Google Sheets

---

## 🎯 Objetivo Principal

Construir un sistema que corre **100% local en tu PC** y hace lo siguiente de forma automática:

1. Lee leads de negocios locales desde Google Sheets
2. Genera un mensaje personalizado para cada negocio usando Claude AI
3. Envía ese mensaje por WhatsApp usando Evolution API
4. Escucha las respuestas entrantes
5. Clasifica con Claude si hay interés real
6. Si hay interés → te notifica a **ti** directamente por WhatsApp

**Tú solo hablas con los que ya quieren escucharte.**

---

## 🏆 Qué se espera lograr

| Métrica | Meta inicial |
|---|---|
| Leads extraídos/día | 50 - 100 |
| Mensajes enviados/día | 30 - 50 (límite anti-ban) |
| Tasa de respuesta estimada | 5% - 15% |
| Leads calientes/semana | 3 - 10 |
| Cierres estimados/mes | 1 - 3 |

---

## 🏗️ Arquitectura del Sistema

```
[Outscraper]
    ↓ exporta CSV/Sheets
[Google Sheets]  ← base de datos de leads
    ↓ n8n lee filas donde contactado = FALSE
[n8n - Schedule Trigger]
    ↓ llama a Claude API
[Claude AI]  ← genera mensaje personalizado con nombre y categoría del negocio
    ↓ envía por HTTP
[Evolution API]  ← envía el WhatsApp desde tu número secundario
    ↓ cuando llega respuesta
[Webhook en n8n]
    ↓ llama a Claude API
[Claude AI]  ← clasifica: INTERESADO / RECHAZO / PREGUNTA
    ↓ si INTERESADO
[Evolution API]  ← te manda notificación a tu número personal
    ↓ siempre
[Google Sheets]  ← actualiza estado del lead
```

---

## 🛠️ Lenguajes y Tecnologías

> **No hay código propio que escribir.** Todo se configura visualmente en n8n más archivos de configuración. El único "código" son los prompts en español para Claude AI y el `docker-compose.yml`.

| Tecnología | Rol | Formato |
|---|---|---|
| **Docker Desktop** | Corre todo localmente en contenedores | YAML |
| **n8n** | Orquestador visual del workflow | JSON + UI drag & drop |
| **Evolution API** | Puente entre n8n y WhatsApp Web | REST API |
| **Claude AI (Anthropic)** | Personalizar mensajes y clasificar respuestas | Prompts en español |
| **Google Sheets** | Base de datos de leads | Google OAuth |
| **Outscraper** | Extracción de negocios de Google Maps | Web UI |

---

## 📁 Estructura del Proyecto en VS Code

```
whatsapp-outreach-bot/
├── docker-compose.yml              ← levanta n8n + Evolution API
├── .env                            ← variables de entorno (API keys, puertos)
├── README.md                       ← este archivo
│
├── n8n/
│   ├── workflows/
│   │   └── outreach-workflow.json  ← importar en n8n
│   └── data/                       ← datos persistentes de n8n (auto-generado)
│
├── evolution/
│   └── instances/                  ← sesiones de WA (auto-generado)
│
├── prompts/
│   ├── personalizar-mensaje.txt    ← prompt Claude: genera mensaje personalizado
│   └── clasificar-respuesta.txt    ← prompt Claude: detecta si hay interés
│
└── sheets/
    └── estructura-leads.md         ← columnas y estados del Google Sheet
```

---

## 🚀 Setup Paso a Paso

### Paso 1 — Requisitos previos

- [ ] Docker Desktop instalado y corriendo
- [ ] VS Code instalado
- [ ] Cuenta de Google (para Google Sheets)
- [ ] Número de WhatsApp **secundario** (chip aparte, NO el tuyo principal)
- [ ] Cuenta en Outscraper → [outscraper.com](https://outscraper.com) (gratis para empezar)
- [ ] API Key de Anthropic (Claude) → [console.anthropic.com](https://console.anthropic.com)

---

### Paso 2 — Crear el proyecto

```bash
mkdir whatsapp-outreach-bot
cd whatsapp-outreach-bot
code .
```

---

### Paso 3 — docker-compose.yml

Crea este archivo en la raíz del proyecto:

```yaml
version: '3.8'
services:

  n8n:
    image: n8nio/n8n
    ports:
      - '5678:5678'
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin123
      - WEBHOOK_URL=http://localhost:5678
    volumes:
      - ./n8n/data:/home/node/.n8n
    restart: unless-stopped

  evolution-api:
    image: atendai/evolution-api:latest
    ports:
      - '8080:8080'
    environment:
      - AUTHENTICATION_API_KEY=mi-api-key-secreta-123
      - QRCODE_LIMIT=30
    volumes:
      - ./evolution/instances:/evolution/instances
    restart: unless-stopped
```

---

### Paso 4 — Levantar los servicios

```bash
# Levantar todo
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps
```

Deberías ver dos contenedores con estado `Up`:
- `n8n` → disponible en http://localhost:5678
- `evolution-api` → disponible en http://localhost:8080

---

### Paso 5 — Conectar tu número de WhatsApp

1. Abre http://localhost:8080/manager en el navegador
2. Crea una instancia nueva con nombre `bot-ventas`
3. Obtén el QR desde la UI
4. Escanea el QR con tu número secundario desde **WhatsApp > Dispositivos vinculados**
5. Listo — Evolution API ya puede enviar mensajes desde ese número

> ⚠️ El número queda vinculado a Evolution API. Usa siempre un chip secundario.

---

### Paso 6 — Configurar Google Sheets

Crea un Google Sheet nuevo con estas columnas exactas en la fila 1:

| Columna | Nombre | Valores posibles |
|---|---|---|
| A | nombre_negocio | Texto libre |
| B | telefono | +573001234567 (con código de país) |
| C | categoria | Restaurante, Hotel, Tienda... |
| D | ciudad | Santa Marta, Barranquilla... |
| E | web | URL o vacío |
| F | contactado | TRUE / FALSE |
| G | estado | `pendiente` / `interesado` / `rechazado` / `sin_respuesta` |
| H | fecha_contacto | Fecha (la pone n8n automáticamente) |
| I | respuesta | Lo que respondió el negocio |

---

### Paso 7 — Importar el workflow en n8n

1. Abre http://localhost:5678
2. Login: `admin` / `admin123`
3. Click en **Import from file**
4. Selecciona `n8n/workflows/outreach-workflow.json`
5. Configura las credenciales:
   - Google Sheets OAuth
   - Anthropic API Key
   - Evolution API (URL: http://evolution-api:8080, Key: `mi-api-key-secreta-123`)

---

## ⚙️ Lógica de los Workflows en n8n

### Workflow 1 — Envío de mensajes

Se activa automáticamente según el horario configurado (ej: 9am de lunes a viernes).

```
Schedule Trigger (9am)
    ↓
Google Sheets Read → filas donde contactado = FALSE
    ↓
Limit Node → máximo 30 filas (límite diario anti-ban)
    ↓
HTTP Request → Claude API → genera mensaje personalizado
    ↓
Wait Node → delay aleatorio 30-90 segundos
    ↓
HTTP Request → Evolution API → envía WhatsApp
    ↓
Google Sheets Update → contactado = TRUE, fecha_contacto = hoy
```

---

### Workflow 2 — Recepción y clasificación de respuestas

Se activa cada vez que alguien responde el mensaje.

```
Webhook (Evolution API notifica a n8n)
    ↓
Google Sheets Read → busca lead por número de teléfono
    ↓
HTTP Request → Claude API → clasifica respuesta
    ↓
IF Node → ¿Claude dijo INTERESADO?
    ↓                        ↓
   SÍ                        NO
    ↓                        ↓
Evolution API          Google Sheets Update
te notifica a ti       estado = rechazado / sin_respuesta
por WhatsApp
```

---

## 🤖 Prompts para Claude AI

### `prompts/personalizar-mensaje.txt`

```
Eres un asistente de ventas para una agencia de desarrollo de software en Santa Marta, Colombia.

Genera un mensaje de WhatsApp corto, amigable y personalizado para contactar a este negocio local.

El mensaje debe:
- Presentarte brevemente como desarrollador de software
- Mencionar el nombre del negocio
- Hacer una pregunta abierta sobre su presencia digital
- Máximo 3 líneas. Sin emojis exagerados.

Datos del negocio:
- Nombre: {{nombre_negocio}}
- Categoría: {{categoria}}
- Ciudad: {{ciudad}}
- Tiene web: {{tiene_web}}
```

---

### `prompts/clasificar-respuesta.txt`

```
Analiza esta respuesta de WhatsApp de un negocio local al que le ofrecimos servicios de software.

Responde SOLO con una de estas palabras, sin explicación:

- INTERESADO → pregunta precios, pide más info, dice que sí, quiere reunión
- RECHAZO → dice que no, ya tienen alguien, no les interesa
- PREGUNTA → hace una pregunta pero no es claro si hay interés
- IGNORAR → spam, mensaje equivocado, no tiene relación

Respuesta recibida: {{respuesta_negocio}}
```

---

## 🛡️ Estrategia Anti-Ban

| Regla | Valor | Por qué |
|---|---|---|
| Mensajes por día | Máx. 50 | Más de 100/día activa filtros de Meta |
| Delay entre mensajes | 30 - 90 seg aleatorio | Imita comportamiento humano |
| Número a usar | Chip secundario nuevo | Protege tu número principal |
| Contenido | 100% personalizado (Claude) | Mensajes idénticos = spam detectado |
| Horario | 9am - 6pm días hábiles | Fuera de horario es sospechoso |
| Primeros 3 días | Máx. 10-15 mensajes/día | "Calentar" el número nuevo |

---

## 💰 Costos del Proyecto

| Servicio | Costo mensual |
|---|---|
| Docker Desktop | $0 |
| n8n (self-hosted local) | $0 |
| Evolution API (local) | $0 |
| Google Sheets | $0 |
| Outscraper (free tier) | $0 |
| Claude API (Anthropic) | ~$2 - $5 USD/mes |
| Chip secundario WhatsApp | ~$15.000 COP/mes |
| **Total** | **~$5 USD + chip** |

---

## 📅 Roadmap

| Fase | Tareas | Tiempo estimado |
|---|---|---|
| **Fase 1 — Setup** | Docker + n8n + Evolution API corriendo. QR escaneado. | 2 - 3 horas |
| **Fase 2 — Leads** | Outscraper + primera extracción + Google Sheet listo. | 1 - 2 horas |
| **Fase 3 — Workflow** | Importar JSON + credenciales + prueba con 1 lead. | 3 - 4 horas |
| **Fase 4 — Prompts** | Afinar prompts de Claude + probar clasificación. | 1 - 2 horas |
| **Fase 5 — Producción** | Primer envío real (5 leads) + monitoreo + ajustes. | 1 día |

---

## 💻 Comandos del Día a Día

```bash
# Iniciar el bot (cada mañana)
docker-compose up -d

# Detener el bot (cuando terminas)
docker-compose down

# Ver logs en tiempo real
docker-compose logs -f

# Ver solo logs de n8n
docker-compose logs -f n8n

# Reiniciar Evolution API si se cae la sesión de WA
docker-compose restart evolution-api
```

---

## ⚠️ Notas Importantes

1. **USA un número secundario** — si hay ban, pierdes ese chip, no el tuyo personal
2. **No envíes más de 50 mensajes/día al inicio** — sube gradualmente semana a semana
3. **Los primeros 3 días envía solo 10-15 mensajes** — para "calentar" el número nuevo
4. **Responde manualmente todos los mensajes** — incluso los rechazos, eso sube la reputación del número
5. **El chip nuevo debe tener WA activado al menos 7 días** antes de conectarlo a Evolution API

---

*WhatsApp Outreach Bot · Alfonsito · ARIS Dev Agency · Santa Marta, Colombia*