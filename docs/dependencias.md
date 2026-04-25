# Dependencias y requisitos

- **Docker Desktop**: recomendado Docker Desktop o Docker Engine con Docker Compose. (Versión mínima recomendada: Docker 20+)
- **docker-compose**: la plantilla usa formato v3.8
- **n8n**: se usa la imagen `n8nio/n8n:latest` (self-hosted en Docker)
- **Evolution API**: imagen `atendai/evolution-api:latest` (gestiona sesiones de WhatsApp)
- **Anthropic / Claude**: cuenta y API key para llamadas a la API de Claude
- **Google Account**: con Google Sheets; crear credenciales OAuth o Service Account
- **Outscraper**: (opcional) para extraer negocios desde Google Maps
- **VS Code** (opcional): edición de archivos y prompts

Recomendaciones de hardware
- CPU: 2 cores mínimo
- RAM: 4 GB (2 GB mínimo para pruebas)
- Disco: 2 GB libres para datos y contenedores

Licencias y costos
- Claude y Outscraper pueden tener costo según uso. Evolution API en local es free, pero el chip y la línea de teléfono tienen coste.
