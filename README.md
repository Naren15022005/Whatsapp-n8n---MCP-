# WhatsApp Outreach Bot (n8n + Evolution API + Claude)

Proyecto para enviar mensajes personalizados por WhatsApp usando n8n, Evolution API y Claude (Anthropic). Corre localmente con Docker.

Quick start

1. Copia la plantilla de variables y complétala:

```bash
# Linux / WSL
cp .env.example .env

# Windows PowerShell
copy .env.example .env
```

2. Levanta los servicios:

```bash
docker-compose up -d
docker-compose ps
```

3. Accede a:
- n8n: http://localhost:5678 (usa las credenciales de `.env`)
- Evolution API manager: http://localhost:8080/manager

4. Configura credenciales en n8n:
- Anthropic / Claude API (usa `ANTHROPIC_API_KEY` desde `.env` o crea credencial en UI)
- Evolution API (URL y API key)
- Google Sheets (ver guía: [readmes/google-oauth.md](readmes/google-oauth.md))

5. Importa el workflow de ejemplo en n8n:

- Importar archivo: [n8n/workflows/outreach-workflow-importable.json](n8n/workflows/outreach-workflow-importable.json)

6. Añade prompts y estructura de hoja de cálculo:
- Prompts: [prompts/personalizar-mensaje.txt](prompts/personalizar-mensaje.txt), [prompts/clasificar-respuesta.txt](prompts/clasificar-respuesta.txt)
- Estructura Sheet: [sheets/estructura-leads.md](sheets/estructura-leads.md)

Comandos útiles

```bash
# Iniciar (cada mañana)
docker-compose up -d

# Detener
docker-compose down

# Logs
docker-compose logs -f
```

Notas de seguridad
- No subas `.env` ni credenciales al repositorio.
- Usa un número secundario para WhatsApp.