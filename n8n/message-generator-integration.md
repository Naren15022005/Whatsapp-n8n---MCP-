**Integración recomendada (más conveniente): `Execute Command` de n8n**

Resumen: la forma más sencilla y robusta para usar los >1000 presets es ejecutar el pequeño CLI desde n8n. Así evitás copiar arrays grandes dentro del workflow y reutilizás `data/presets.json`.

- Requisitos: `node` disponible en el mismo host donde corre n8n y que n8n tenga permiso para ejecutar comandos.
- Archivo de presets generado: [data/presets.json](data/presets.json)
- Script CLI: [scripts/message-generator-cli.js](scripts/message-generator-cli.js)

Ejemplo rápido (terminal):
```bash
node scripts/message-generator-cli.js --lead='{"nombre":"Juan","categoria":"cafetería","ciudad":"Bogotá","tiene_web":false}' --usePresets
```

Cómo usarlo en n8n (Execute Command node):

1. Añadí un nodo `Execute Command` antes del nodo que envía el mensaje.
2. En `Command` pon `node`.
3. En `Arguments` pon `scripts/message-generator-cli.js --usePresets`.
4. Pasa el JSON del `lead` por `stdin` (marcando "Read from stdin"), o arma la línea incluyendo `--lead` con la expresión del workflow.

Ejemplo usando `stdin` (en n8n pon como Input Data la expresión que contiene el lead):
```bash
echo '{"nombre":"Ana","categoria":"restaurante","ciudad":"Cali","tiene_web":true}' | node scripts/message-generator-cli.js --usePresets
```

Alternativa si no podés ejecutar comandos: copiar/adaptar la lógica de [scripts/message-generator.js](scripts/message-generator.js) directamente en un `Function` node (menos conveniente por el tamaño de `presets`).

Si querés, puedo generar una versión más compacta pensada exclusivamente para pegar en un `Function` node.
