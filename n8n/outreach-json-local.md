# Outreach Bot - JSON local (instrucciones para n8n)

Este archivo resume cómo crear en n8n un flujo que use `data/leads.json` local y actualice el archivo tras enviar mensajes.

1. Abrir n8n en `http://localhost:5678` y crear workflow: `Outreach Bot - JSON Local`.
2. Nodos principales (resumen):
   - Schedule Trigger (cada día a las 9:00) o ejecuta manualmente para pruebas.
   - Read File: lee `C:/.../Whatsapp-n8n---MCP-/data/leads.json` y pasa `data`.
   - Item Lists: Split Out Items por `leads`.
   - Filter: filtrar `contactado == false`.
   - Limit: limitar a 30 por ejecución.
   - Execute Command: `node scripts/message-generator-cli.js --usePresets` (input JSON). Recibe `mensaje`, `plantilla_id`, `longitud`, `emoji_count`.
   - Wait: `{{ Math.floor(Math.random() * 60) + 30 }}` segundos.
   - HTTP Request: POST a `http://localhost:8080/message/sendText/outreach-bot` con body `{ number: {{ $json.telefono }}, text: {{ $json.mensaje }} }` y header `apikey`.
   - Execute Command: `node scripts/update-lead.js {{ $json.id }} '{{ JSON.stringify({ estado: "enviado", plantilla_id: $json.plantilla_id, mensaje: $json.mensaje, mensaje_longitud: $json.longitud, emoji_count: $json.emoji_count }) }}'` para actualizar `data/leads.json`.

Notas:
- Asegurate de que n8n tenga permisos de lectura/escritura sobre la ruta del proyecto (especialmente si n8n corre en Docker: monta el volumen del repo en el container).
- El `Execute Command` debe ejecutarse en el mismo host donde existen `scripts/*` y `data/*` (o montar el repo dentro del contenedor n8n).
- Para pruebas rápidas: ejecuta el workflow manualmente y observa `data/leads.json` y `data/dashboard.html`.
