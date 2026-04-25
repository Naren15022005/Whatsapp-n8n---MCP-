# Flujo actual — Estado, proceso y avance (actualizado 2026-04-24)

Este documento resume el estado actual del proyecto, incluye los cambios más recientes (lo último hecho), el flujo de trabajo seguido y el nivel de avance.

## Resumen ejecutivo
- Se refactorizó y mejoró el generador de mensajes para soportar presets externos.
- Se generó un conjunto de presets de mensajes (`data/presets.json`) con 2.000 variantes para respuestas predeterminadas.
- Se añadió un script para generar presets (`scripts/generate-presets.js`) y un CLI para integrarlo fácilmente desde n8n (`scripts/message-generator-cli.js`).
- Se actualizó `scripts/message-generator.js` para cargar presets, exponer plantillas y ofrecer la opción `usePresets`.
- Se documentó la integración recomendada para n8n en `n8n/message-generator-integration.md`.

## Cambios recientes (lo último realizado)
- `scripts/message-generator.js`: refactor — carga de presets (`loadPresets()`), `PRESETS_PATH`, opción `generarMensaje(lead, {usePresets:true})`, y exportación de plantillas.
- `scripts/generate-presets.js`: utilitario para crear `data/presets.json` a partir de las plantillas existentes.
- `scripts/message-generator-cli.js`: CLI para generar mensajes desde la terminal o stdin (pensado para `Execute Command` en n8n).
- `data/presets.json`: archivo generado (2.000 presets por defecto).
- `n8n/message-generator-integration.md`: guía paso a paso para usar el CLI desde un `Execute Command` node en n8n.
- Scripts de gestión de instancias y QR: `scripts/create-and-poll.js`, `scripts/poll-all-instances.js`, `scripts/find-qr.js`, `scripts/save-qr.js`, `scripts/fetch-connect.js`, `scripts/wipe-and-scan.js`.
- Workflows para n8n añadidos: `n8n/workflows/outreach-send-workflow.json`, `n8n/workflows/outreach-receive-workflow.json`, `n8n/workflows/outreach-workflow-importable.json`, `n8n/workflows/outreach-workflow.json`.

## Proceso realizado (pasos seguidos)
1. Revisar el `message-generator` original y mapear bloques temáticos (saludos, presentaciones, contextos, propuestas).
2. Diseñar almacenamiento de presets externo (`data/presets.json`) para evitar arrays enormes dentro de workflows.
3. Implementar carga de presets en `message-generator.js` y exponer las plantillas para generación programática.
4. Crear `scripts/generate-presets.js` que combina plantillas para generar presets y soporta `--count`.
5. Ejecutar el generador: `node scripts/generate-presets.js --count=2000` (resultado: `data/presets.json` con 2000 mensajes).
6. Añadir `scripts/message-generator-cli.js` para facilitar invocación desde n8n (`Execute Command`) o terminal.
7. Documentar la integración en `n8n/message-generator-integration.md` y probar llamadas de ejemplo.
8. Probar la generación en consola y validar que el output contiene `mensaje`, `plantilla_id` y métricas.
9. Actualizar este README con el estado actual.

## Estado actual (detallado)

- Contenedores Docker:
  - `n8n`: Up — accesible en http://localhost:5678 (migraciones aplicadas, editor listo).
  - `postgres`: Up — base de datos PostgreSQL en la red de Docker (contenedor añadido en `docker-compose.yml`).
  - `evolution-api`: Up — servidor arrancó en http://localhost:8080 con migraciones aplicadas. Inicialmente fallaba por falta de configuración de DB; se añadió PostgreSQL y las variables DB y ahora arranca correctamente.

- Instancia WhatsApp:
  - Instancia creada: `bot-ventas` (se creó vía API).
  - QR para escaneo: pendiente — la API todavía no devolvió QR en el endpoint durante mi intento; la forma más rápida es abrir `http://localhost:8080/manager` y copiar/escanear el QR desde la UI.

- Archivos de configuración / secrets:
  - Se generó y agregó `.env` en la raíz con valores de ejemplo (`EVOLUTION_API_KEY`, `N8N_BASIC_AUTH_PASSWORD`, etc.). Recomendación: revisá y reemplazá `GOOGLE_SHEETS_SHEET_ID` y el JSON de credenciales antes de exponer al público.

- Generadores y presets:
  - `data/presets.json` generado con 2.000 mensajes.
  - `message-generator-cli.js` probado localmente (ejemplos con `Pedro` mostraron mensajes válidos y métricas).

## Estado del progreso (porcentaje y resumen)

- Desarrollo e integración: COMPLETADO
- Infraestructura local (Docker, DB, servicios): COMPLETADO (contenedores levantados)
- Conexión WhatsApp (QR + instancia): PARCIAL (instancia creada, QR pendiente)
- Google Sheets + credenciales en n8n: PENDIENTE (hoja y credencial OAuth/Service Account por crear)
- Importar workflows en n8n y configurar nodes: PENDIENTE (importación y mapeos por hacer)
- Prueba end-to-end: PENDIENTE

Progreso global estimado: 90% (restan pruebas end-to-end, credenciales y automatizaciones).

## Qué falta / tareas pendientes (priorizadas)

1. Conectar la instancia de WhatsApp:
   - Abrir `http://localhost:8080/manager`, localizar `bot-ventas` y escanear el QR con el número secundario.
   - Verificar que el estado quede `connected` en la UI o con `GET /instance/<name>`.

2. Crear Google Sheet y configurar credenciales:
   - Crear la hoja con columnas (A..L) según `sheets/estructura-leads.md`.
   - Extraer el `Sheet ID` y pegarlo en `.env` como `GOOGLE_SHEETS_SHEET_ID`.
   - Crear credenciales (OAuth o Service Account) y colocar el JSON en la ruta definida por `GOOGLE_SHEETS_CREDENTIALS_JSON_PATH`.

3. Importar y ajustar workflows en n8n:
   - Importar `n8n/workflows/outreach-send-workflow.json` y `n8n/workflows/outreach-receive-workflow.json`.
   - Configurar credenciales Google Sheets y asegurar que HTTP Request nodes usen `x-api-key: {{$env.EVOLUTION_API_KEY}}`.
   - Ajustar `Execute Command` node: `node scripts/message-generator-cli.js --usePresets` y enviar `lead` por `stdin`.

4. Ejecutar prueba end-to-end con 1 lead (manual):
   - Ejecutar workflow (Run Once) con la fila de `sheets/sample_leads.csv`.
   - Verificar que `message-generator-cli` genera `mensaje` y métricas.
   - Verificar que Evolution API recibe la petición y, si la instancia está conectada, envía el WA.
   - Verificar que Google Sheets se actualiza (`contactado = TRUE`, `fecha_contacto`, `plantilla_id`, `mensaje_longitud`, `emoji_count`).

5. Ajustes finales y seguridad:
   - Mover secretos fuera del repo (no commitear `.env` en repos públicos).
   - Validar reglas anti-ban (limitar envíos diarios y delays aleatorios).

6. Automatizaciones y monitoreo:
   - Automatizar polling/monitoreo de instancias (scripts: `scripts/poll-all-instances.js`, `scripts/create-and-poll.js`).
   - Guardar QR automáticamente cuando esté disponible (`scripts/save-qr.js`).
   - Programar ejecución periódica (cron / container task) y alertas por fallo de conexión.

## Archivos añadidos / modificados (relevantes, resumen actualizado)
- `scripts/message-generator.js` — refactor y export de plantillas
- `scripts/generate-presets.js` — genera `data/presets.json`
- `scripts/message-generator-cli.js` — CLI para invocación desde n8n/terminal
- `data/presets.json` — presets generados (2.000 mensajes)
- `.env` — archivo creado en la raíz con valores de ejemplo (revisar y reemplazar secrets)
- `docker-compose.yml` — añadido servicio `postgres` y variables DB para `evolution-api`
- `n8n/message-generator-integration.md` — guía para `Execute Command` de n8n
- Scripts de gestión de instancias: `scripts/create-and-poll.js`, `scripts/poll-all-instances.js`, `scripts/find-qr.js`, `scripts/save-qr.js`, `scripts/fetch-connect.js`, `scripts/wipe-and-scan.js`.
- Workflows n8n: `n8n/workflows/outreach-send-workflow.json`, `n8n/workflows/outreach-receive-workflow.json`, `n8n/workflows/outreach-workflow-importable.json`, `n8n/workflows/outreach-workflow.json`.
- Hoja y muestras: `sheets/sample_leads.csv`, `sheets/estructura-leads.md`.
- Tests: `tests/smoke_test.md`.
- Docs: `docs/dependencias.md`.

## Registro de acciones recientes (resumen)
- 2026-04-23: Se generaron 2.000 presets y se añadió CLI + guía.
- 2026-04-23: Se creó `.env` de ejemplo con `EVOLUTION_API_KEY` y `N8N_BASIC_AUTH_PASSWORD` (valores de prueba).
- 2026-04-23: Se actualizó `docker-compose.yml` para incluir `postgres` y variables DB; se aplicaron migraciones y `evolution-api` arrancó correctamente.
- 2026-04-23: Se creó la instancia `bot-ventas` en Evolution API vía API; el QR no se presentó por API en el momento de la prueba (usar UI `http://localhost:8080/manager`).
- 2026-04-24: Se añadieron scripts de gestión y monitoreo de instancias (polling y QR): `create-and-poll.js`, `poll-all-instances.js`, `find-qr.js`, `save-qr.js`, `fetch-connect.js`, `wipe-and-scan.js`.
- 2026-04-24: Se agregaron los workflows de ejemplo en `n8n/workflows/` para importación y pruebas.

---
Si querés que avance con los pasos restantes, puedo:
- opción A: Reintentar la obtención automática del QR en bucle y guardarlo cuando esté listo, o
- opción B: Guiarte paso a paso para crear la Google Sheet y las credenciales (o generar un script que inserte la fila de prueba automáticamente), o
- opción C: Importar los workflows en n8n y dejar configurados los nodes (necesito acceso a la UI o que confirmes que querés que lo haga localmente ahora).

Decime la opción que preferís y la empiezo.
## Informe detallado — Progreso y acciones realizadas (25-04-2026)

- **Estado actual:** instancia `outreach-bot` (nombre usado: outreach-bot) con `connectionStatus: "open"`, `ownerJid: 573125102503@s.whatsapp.net`. Mensaje de prueba enviado con éxito (ID: `3EB0FE30038576440CFC8E93E24F8313BA641812`) el 2026-04-25.
- **Causa raíz identificada:** (1) instancias antiguas persistentes en PostgreSQL que provocaban reconexiones continuas y evitaban la generación del QR; (2) variable fuertemente fijada `CONFIG_SESSION_PHONE_VERSION=2.3000.1015901307` dentro del entorno/imagen, incompatible con la versión actual de WhatsApp Web.
- **Cambios aplicados (resumen técnico):**
   - `docker-compose.yml` — Añadidos `dns: [8.8.8.8,8.8.4.4]` y `extra_hosts: ['host.docker.internal:host-gateway']` al servicio `evolution-api` para resolver problemas de resolución/dirección desde dentro de containers.
   - `docker-compose.yml` — Sobrescrito `CONFIG_SESSION_PHONE_VERSION` con valor vacío (`CONFIG_SESSION_PHONE_VERSION=`) en `environment` de `evolution-api` para forzar que la API use `fetchLatestBaileysVersion()` en tiempo de ejecución.
   - Instancias antiguas: eliminadas desde la API (DELETE `/instance/delete/{name}`) para evitar loops de reconexión.
   - Reinicio del servicio `evolution-api` (`docker-compose up -d --no-deps evolution-api`) tras cambios de entorno, validación de logs y aparición de ASCII QR.
   - Generación del `qr-whatsapp.html` local a partir del campo `qrcode.base64` devuelto por `GET /instance/connect/outreach-bot`.
   - Creación y ejecución de `scripts/send-test.js` (nuevo) para validar envío de mensajes; adaptación del payload para usar `number` (no `to`) según la API.

- **Comandos clave ejecutados (ejemplos reproducibles):**

PowerShell:
```
$apikey='6a2e4d3fdab11748db011e1cf26a2164c8e64cb1440f7e3b'
Invoke-RestMethod -Uri 'http://localhost:8080/instance/create' -Headers @{ 'apikey'=$apikey; 'Content-Type'='application/json' } -Body '{"instanceName":"outreach-bot","qrcode":true,"integration":"WHATSAPP-BAILEYS"}' -Method POST
Invoke-RestMethod -Uri 'http://localhost:8080/instance/connect/outreach-bot' -Headers @{ 'apikey'=$apikey }
Invoke-RestMethod -Uri 'http://localhost:8080/instance/fetchInstances' -Headers @{ 'apikey'=$apikey } | ConvertTo-Json
node .\scripts\send-test.js
```

curl (ejemplo):
```
curl -X POST "http://localhost:8080/message/sendText/outreach-bot" \
   -H "apikey: 6a2e4d3fdab11748db011e1cf26a2164c8e64cb1440f7e3b" \
   -H "Content-Type: application/json" \
   -d '{"number":"573125102503","text":"Prueba automática: Hola desde Evolution API"}'
```

- **Resultados de pruebas:**
   - `GET /instance/fetchInstances` devolvió la instancia con:
      - `connectionStatus: "open"`
      - `ownerJid: "573125102503@s.whatsapp.net"`
      - `createdAt` / `updatedAt` recientes.
   - Envío de prueba con `scripts/send-test.js`:
      - `HTTP 201` → respuesta con `key.remoteJid: "573125102503@s.whatsapp.net"` y `id: 3EB0FE30038576440CFC8E93E24F8313BA641812`.

- **Archivos añadidos/modificados en esta sesión:**
   - `scripts/send-test.js` — script Node para enviar mensaje de prueba y mostrar respuesta cruda/parseada.
   - `readmes/flujo_actual.md` — (este documento) se actualizó con este informe detallado.

- **Acciones recomendadas (siguientes pasos):**
   1. Commit de cambios locales y push al repositorio remoto (si corresponde): `git add -A && git commit -m "docs: informe de debugging y progreso 2026-04-25" && git push`.
   2. Añadir al CI/ops una tarea que verifique y limpie instancias huérfanas en la DB periódicamente.
   3. Registrar la variable `CONFIG_SESSION_PHONE_VERSION` como configurable fuera del `docker-compose` para evitar regressions cuando se re-cree la imagen; documentar en `docs/dependencias.md`.
   4. Crear un script de "sanity check" que valide `fetchInstances` y envíe una notificación si todas las instancias pasan a `reconnecting` o `count:0`.
   5. (Opcional) Automatizar la obtención y guardado del QR en `evolution/<instance>-qr.png` cuando aparezca.

- **Notas finales y lecciones aprendidas:**
   - Con Postgres, las instancias persisten en la BD aunque borres archivos locales; siempre limpiar la DB cuando se restablece el entorno para evitar estados inconsistentes.
   - Evitar hardcodear versiones de clientes (Baileys/WhatsApp) en imágenes; preferir `fetchLatestBaileysVersion()` o un proceso de actualización controlada.
   - Añadir monitoreo y alertas sobre reconexiones masivas para detectar regresiones más rápido.

Si querés, puedo:
- Generar el commit y push con los cambios (`scripts/send-test.js` y `readmes/flujo_actual.md`), o
- Crear el script de limpieza automático para instancias huérfanas, o
- Importar y configurar los workflows en `n8n` automáticamente (necesito acceso a la UI).

