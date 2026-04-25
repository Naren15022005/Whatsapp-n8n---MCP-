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

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: 8080, path, method: 'GET', headers: { 'apikey': key } };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({status:res.statusCode, body: data}); } catch (e) { reject(e); }
      });
    });
    req.on('error', err => reject(err));
    req.end();
  });
}

(async () => {
  try {
    const inst = await httpGet('/instance/fetchInstances');
    const obj = JSON.parse(inst.body);
    const list = obj && obj.value ? obj.value : [];
    for (const ins of list) {
      const name = ins.name;
      console.log('Checking', name);
      try {
        const r = await httpGet(`/instance/connect/${encodeURIComponent(name)}`);
        const data = JSON.parse(r.body);
        let base64 = null;
        if (data && data.data && Array.isArray(data.data) && data.data.length>0 && data.data[0].qrcode && data.data[0].qrcode.base64) base64 = data.data[0].qrcode.base64;
        else if (data && data.qrcode && data.qrcode.base64) base64 = data.qrcode.base64;
        if (base64) {
          const file = `evolution/${name}-qr.png`;
          fs.writeFileSync(file, Buffer.from(base64, 'base64'));
          console.log('WROTE', file);
          process.exit(0);
        }
      } catch (e) {
        // continue
      }
    }
    console.log('NO_QR_FOUND');
    process.exit(2);
  } catch (e) {
    console.error('ERROR', e.message);
    process.exit(3);
  }
})();
