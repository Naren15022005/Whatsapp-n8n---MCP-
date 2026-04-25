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
  path: '/instance/connect/Bot-Ventas-2',
  method: 'GET',
  headers: { 'apikey': key }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const obj = JSON.parse(data);
      let base64 = null;
      if (obj && obj.data && Array.isArray(obj.data) && obj.data.length>0 && obj.data[0].qrcode && obj.data[0].qrcode.base64) base64 = obj.data[0].qrcode.base64;
      else if (obj && obj.qrcode && obj.qrcode.base64) base64 = obj.qrcode.base64;
      if (!base64) { console.error('NO_BASE64'); process.exit(2); }
      const buf = Buffer.from(base64, 'base64');
      fs.writeFileSync('evolution/Bot-Ventas-2-qr.png', buf);
      console.log('WROTE');
    } catch (err) { console.error('PARSE_ERROR', err.message); process.exit(3); }
  });
});
req.on('error', err => { console.error('REQ_ERROR', err.message); process.exit(4); });
req.end();
