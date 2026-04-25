const fs = require('fs');
const http = require('http');

function getApiKey() {
  const env = fs.readFileSync('.env','utf8').split(/\r?\n/);
  for (const line of env) {
    if (line.startsWith('EVOLUTION_API_KEY=')) return line.split('=')[1].trim();
  }
  return null;
}

const key = getApiKey();
if (!key) { console.error('NO_KEY'); process.exit(1); }

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/instance/connect/bot-ventas',
  method: 'GET',
  headers: { 'apikey': key }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
});
req.on('error', err => { console.error('REQ_ERROR', err.message); process.exit(4); });
req.end();
