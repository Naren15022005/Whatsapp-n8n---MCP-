# Configurar y mapear el workflow en n8n

Este documento explica paso a paso cómo convertir la plantilla importable en un workflow funcional en n8n, con las expresiones recomendadas para mapear los campos desde Google Sheets, generar el prompt para Claude, aplicar un delay aleatorio y enviar el mensaje por Evolution API.

1) Google Sheets — Obtener filas

- Node: **Google Sheets**
- Operación: `Get All` (o `Lookup` si prefieres buscar sólo filas con `contactado = FALSE`)
- Range: `Sheet1!A2:I` (asumiendo que la fila 1 tiene headers)
- Opciones: `Return All = false`, `Limit = 30` (límite diario anti-ban)

Nota: Si configuras la node para que use la fila de encabezado como keys, n8n devolverá objetos con propiedades `nombre_negocio`, `telefono`, etc. Si no, tendrás que mapear por índice (A, B, C...). Las expresiones abajo usan la versión con headers.

2) Split In Batches

- Node: **SplitInBatches**
- Batch Size: `1` (procesa fila a fila para respetar delays)

3) Set — normalizar campos

Usa un `Set` node para crear campos claros que usarás después. Añade los siguientes valores (Value → Expression):

- `nombre_negocio` → `{{$json["nombre_negocio"]}}`
- `telefono` → `{{$json["telefono"]}}`
- `categoria` → `{{$json["categoria"]}}`
- `ciudad` → `{{$json["ciudad"]}}`
- `web` → `{{$json["web"]}}`

Si tu Google Sheets no devuelve keys, usa `{{$json["A"]}}`, `{{$json["B"]}}` según corresponda.

4) Function — construir prompt para Claude

Añade un `Function` node con este código (reemplaza el texto del prompt si quieres):

```javascript
items[0].json.tiene_web = items[0].json.web && items[0].json.web.toString().trim() ? 'Sí' : 'No';
items[0].json.prompt = `Eres un asistente de ventas para una agencia de desarrollo de software en Santa Marta, Colombia.

Genera un mensaje de WhatsApp corto, amigable y personalizado para contactar a este negocio local.

El mensaje debe:
- Presentarte brevemente como desarrollador de software
- Mencionar el nombre del negocio
- Hacer una pregunta abierta sobre su presencia digital
- Máximo 3 líneas. Sin emojis exagerados.

Datos del negocio:
- Nombre: ${items[0].json.nombre_negocio}
- Categoría: ${items[0].json.categoria}
- Ciudad: ${items[0].json.ciudad}
- Tiene web: ${items[0].json.tiene_web}`;
return items;
```

5) HTTP Request — Claude (Anthropic)

- URL: `https://api.anthropic.com/v1/complete`
- Method: `POST`
- Headers:
  - `x-api-key`: `{{$env.ANTHROPIC_API_KEY}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):

```json
{
  "model": "claude",
  "prompt": "{{$json.prompt}}",
  "max_tokens": 300
}
```

Nota: revisa el campo exacto en la respuesta de Claude para extraer el texto final. En muchos casos la respuesta viene en `body.completion` o `body.output`.

6) Function — parsear respuesta de Claude y limpiar

```javascript
const body = items[0].json.body || {};
let text = '';
if (body.completion) text = body.completion;
else if (body.output) text = body.output;
else if (body.message) text = body.message;
items[0].json.message = (text || '').toString().replace(/^"|"$/g,'').trim();
return items;
```

7) Function — calcular delay aleatorio (segundos)

```javascript
items[0].json.waitSeconds = Math.floor(Math.random() * (90 - 30 + 1)) + 30;
return items;
```

8) Wait Node

- Unit: `seconds`
- Value (Expression): `{{$json.waitSeconds}}`

9) HTTP Request — Evolution API (enviar WhatsApp)

- URL: `http://evolution-api:8080/wa/sendMessage`
- Method: `POST`
- Headers:
  - `x-api-key`: `{{$env.EVOLUTION_API_KEY}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):

```json
{
  "to": "{{$json.telefono}}",
  "message": "{{$json.message}}"
}
```

Dependiendo de la versión de Evolution API, el campo `to` puede necesitar formato con prefijo `+` o sin espacios. Adapta según tu instancia.

10) Google Sheets — Update

- Busca la fila por `telefono` (puedes usar un `Google Sheets` node en `Lookup` o `Get` para encontrar el rowNumber) y luego `Update` esa fila cambiando:
  - `contactado` → `TRUE`
  - `fecha_contacto` → `={{$now.toLocaleDateString('es-CO')}}` (o usar `new Date().toISOString().slice(0,10)` desde un Function)

11) Consejos de prueba

- Importa el workflow y antes de activarlo, ejecuta el trigger manualmente (Run Once) con una sola fila de prueba.
- Revisa las respuestas de las nodes `HTTP Request` para validar la estructura y ajustar las expresiones de parseo.

Si quieres, puedo generar una versión del workflow ya configurada con los mismos nombres de node y conexiones para que la importes directamente (revisarla manualmente después). ¿La quieres ahora?
