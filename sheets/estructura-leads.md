# Estructura de la hoja de Google Sheets (leads)

Crea una hoja y coloca estas columnas exactas en la fila 1:

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
| J | plantilla_id | ID de la plantilla usada para enviar el mensaje (Sx-Py-Cz-PRw) |
| K | mensaje | Mensaje enviado por WhatsApp (texto completo) |
| L | mensaje_longitud | Número de caracteres del mensaje |
| M | emoji_count | Cantidad de emojis en el mensaje |
