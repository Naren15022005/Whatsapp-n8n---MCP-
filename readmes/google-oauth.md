# Guía: generar credenciales Google (Google Sheets)

1) Crea un proyecto en Google Cloud Console: https://console.cloud.google.com/

2) Habilita APIs necesarias:
- Google Sheets API
- Google Drive API

3) Configura OAuth Consent Screen (si usarás OAuth):
- Tipo: External (para pruebas internas basta con añadir usuarios de prueba)
- Completa los campos requeridos (nombre de app, email de soporte)

4) Crea credenciales → OAuth 2.0 Client IDs
- Tipo: Web application
- Nombre: `n8n-local` (ejemplo)
- Authorized redirect URIs: `http://localhost:5678/rest/oauth2-credential/callback`

5) Copia `Client ID` y `Client Secret`.

6) En n8n (http://localhost:5678):
- Ir a **Credentials** → **New Credential** → elegir **Google Sheets OAuth2**
- Pegar `Client ID` y `Client Secret`
- Conectar la cuenta y autorizar el acceso a la hoja que usarás

Alternativa: Service Account
- Crea un Service Account en IAM → Keys → JSON
- Descarga el JSON y **comparte la hoja** con el email del service account
- En n8n crea credencial de tipo Service Account y pega el JSON

Notas
- Si N8N corre tras un proxy o tiene `N8N_PUBLIC_URL`, usa esa URL completa en lugar de `http://localhost:5678` al registrar el redirect URI.
- Guarda cualquier JSON/secretos fuera del repo y usa `.env` o montajes de volumen para entregarlos al contenedor.
