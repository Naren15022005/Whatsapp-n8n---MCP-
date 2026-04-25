const fs = require('fs');
const http = require('http');

function getApiKey() {
  const envPath = '.env';
  if (!fs.existsSync(envPath)) return null;
  const env = fs.readFileSync(envPath,'utf8').split(/\r?\n/);
  for (const line of env) {
    if (line.startsWith('EVOLUTION_API_KEY=')) return line.split('=')[1].trim();
  }
  return null;
}

const key = getApiKey();
if (!key) { console.error('NO_KEY'); process.exit(1); }

const body = { number: '573125102503', text: 'Prueba automática: Hola desde Evolution API' };

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/message/sendText/outreach-bot',
  method: 'POST',
  headers: { 'apikey': key, 'Content-Type': 'application/json' }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      console.log('STATUS', res.statusCode);
      if (data && data.trim()) {
        console.log('RAW_BODY:', data);
        try { console.log('PARSED:', JSON.parse(data)); } catch (e) { console.log('PARSE_ERROR, RAW:', data); }
      } else {
        console.log('(no body)');
      }
    } catch (e) {
      console.error('PARSE_ERROR', e && e.message ? e.message : e);
    }
  });
});

req.on('error', err => { console.error('REQ_ERROR', err.message); process.exit(4); });
req.write(JSON.stringify(body));
req.end();
