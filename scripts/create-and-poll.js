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

function httpRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const headers = { 'apikey': key };
    let dataStr = null;
    if (body) { dataStr = JSON.stringify(body); headers['Content-Type'] = 'application/json'; }
    const options = { hostname: 'localhost', port: 8080, path, method, headers };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', err => reject(err));
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

(async () => {
  const name = process.argv[2] || 'bot-ventas-live';
  console.log('CREATE:', name);
  try {
    const createResp = await httpRequest('POST', '/instance/create', { instanceName: name, qrcode: true, integration: 'WHATSAPP-BAILEYS' });
    console.log('CREATE_STATUS', createResp.status);
    if (createResp.status >= 400) {
      console.error('CREATE_FAILED', createResp.body);
    }
  } catch (e) {
    console.error('CREATE_ERROR', e.message);
  }

  console.log('Polling for QR (up to ~60s)...');
  for (let i=0;i<30;i++) {
    try {
      const r = await httpRequest('GET', `/instance/connect/${encodeURIComponent(name)}`);
      if (r.status === 200) {
        try {
          const data = JSON.parse(r.body);
          let base64 = null;
          if (data && data.data && Array.isArray(data.data) && data.data.length>0 && data.data[0].qrcode && data.data[0].qrcode.base64) base64 = data.data[0].qrcode.base64;
          else if (data && data.qrcode && data.qrcode.base64) base64 = data.qrcode.base64;
          if (base64) {
            const file = `evolution/${name}-qr.png`;
            fs.writeFileSync(file, Buffer.from(base64, 'base64'));
            const html = `<html><body><img src=\"data:image/png;base64,${base64}\"/></body></html>`;
            fs.writeFileSync(`evolution/${name}-qr.html`, html, 'utf8');
            console.log('WROTE', file);
            process.exit(0);
          }
        } catch (e) {
          // continue
        }
      }
    } catch (e) {
      // continue
    }
    await new Promise(r=>setTimeout(r,2000));
  }
  console.log('TIMEOUT_NO_QR');
  process.exit(2);
})();
