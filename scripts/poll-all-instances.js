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
if (!key) {
  console.error('NO_KEY');
  process.exit(1);
}

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: 8080, path, method: 'GET', headers: { 'apikey': key } };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', err => reject(err));
    req.end();
  });
}

(async () => {
  const timeoutSec = parseInt(process.argv[2] || '120', 10);
  const start = Date.now();
  while ((Date.now() - start) / 1000 < timeoutSec) {
    try {
      const instResp = await httpGet('/instance/fetchInstances');
      if (instResp.status !== 200) {
        // try again
      } else {
        let list = [];
        try {
          const obj = JSON.parse(instResp.body);
          list = obj && obj.value ? obj.value.map(i=>i.name) : (Array.isArray(obj) ? obj.map(i=>i.name) : []);
        } catch (e) {
          // ignore
        }
        // also include some common names to try explicitly
        const candidates = Array.from(new Set([...(list||[]), 'bot-ventas', 'bot-ventas-2','Bot-Ventas-2','bot-ventas-3','bot-ventas-clean','bot-ventas-live']));
        for (const name of candidates) {
          if (!name) continue;
          try {
            const enc = encodeURIComponent(name);
            const r = await httpGet(`/instance/connect/${enc}`);
            if (r.status === 200) {
              try {
                const data = JSON.parse(r.body);
                let base64 = null;
                if (data) {
                  if (data.qrcode && data.qrcode.base64) base64 = data.qrcode.base64;
                  else if (data.data && Array.isArray(data.data) && data.data.length>0) {
                    for (const d of data.data) {
                      if (d && d.qrcode && d.qrcode.base64) { base64 = d.qrcode.base64; break; }
                    }
                  }
                }
                if (base64) {
                  const safe = name.replace(/[^a-zA-Z0-9-_\.]/g,'_');
                  const pngPath = `evolution/${safe}-qr.png`;
                  const htmlPath = `evolution/${safe}-qr.html`;
                  fs.writeFileSync(pngPath, Buffer.from(base64,'base64'));
                  fs.writeFileSync(htmlPath, `<html><body style=\"display:flex;align-items:center;justify-content:center;height:100vh\"><img src=\"data:image/png;base64,${base64}\"/></body></html>`, 'utf8');
                  console.log('FOUND', name, pngPath, htmlPath);
                  process.exit(0);
                }
              } catch (e) {
                // parse error
              }
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      // ignore
    }
    await new Promise(r=>setTimeout(r,2000));
  }
  console.log('NO_QR_FOUND');
  process.exit(2);
})();
