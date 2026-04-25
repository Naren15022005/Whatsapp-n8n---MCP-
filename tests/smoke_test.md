# Prueba rápida (smoke test) — flujo end-to-end

Pasos mínimos para verificar el flujo una vez tengas todo configurado:

1. Copia `.env.example` → `.env` y completa las claves (`ANTRHOPIC_API_KEY`, `EVOLUTION_API_KEY`, `GOOGLE_SHEETS_SHEET_ID`).

2. Levanta los contenedores:

```powershell
docker-compose up -d
docker-compose ps
```

3. En Evolution API manager (`http://localhost:8080/manager`) crea instancia `bot-ventas` y escanea el QR con tu número secundario.

4. Crea un Google Sheet nuevo y pega el contenido de `sheets/sample_leads.csv` en la hoja (la fila 1 debe ser header).

5. En n8n (http://localhost:5678) realiza:
- Credenciales Google Sheets (OAuth o Service Account)
- Credencial HTTP/Request para Claude si prefieres, pero en el node usa `{{$env.ANTHROPIC_API_KEY}}` en header
- Credencial para Evolution (usa `EVOLUTION_API_KEY` en header `x-api-key`)

6. Importa el workflow: `n8n/workflows/outreach-workflow-importable.json` y verifica que los nombres de node coincidan con los de la guía (`outreach_workflow_setup.md`).

7. Ejecuta el workflow manualmente (Execute Workflow) o dispara el `Schedule Trigger` manualmente.

8. Observa en n8n los outputs de cada node y en `Evolution API manager` si la solicitud de envío llegó. En Google Sheets debería actualizarse `contactado = TRUE` y `fecha_contacto`.

Problemas comunes
- Si Claude no devuelve texto en `body.completion`, inspecciona el `HTTP Request` response para ajustar `Parse Claude response` function.
- Si Evolution devuelve error 401, revisa la `EVOLUTION_API_KEY` y el header usado (`x-api-key` vs Authorization).
