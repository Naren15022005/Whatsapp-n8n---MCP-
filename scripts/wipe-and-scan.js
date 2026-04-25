const fs = require('fs');
const http = require('http');
const { exec } = require('child_process');

function getApiKey() {
  const env = fs.readFileSync('.env','utf8').split(/\r?\n/);
  for (const line of env) {
    if (line.startsWith('EVOLUTION_API_KEY=')) return line.split('=')[1].trim();
  }
  return null;
}

const key = getApiKey();
if (!key) { console.error('NO_KEY'); process.exit(1); }

function httpReq(method, path, body) {
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

function run(cmd) {
  return new Promise((resolve,reject)=>{
    exec(cmd, { cwd: process.cwd() }, (err, stdout, stderr)=>{
      if (err) return reject({err, stdout, stderr});
      resolve({ stdout, stderr });
    });
  });
}

(async ()=>{
  try {
    console.log('Fetching instances...');
    const inst = await httpReq('GET','/instance/fetchInstances');
    let list = [];
    try { const obj = JSON.parse(inst.body); list = obj && obj.value ? obj.value : []; } catch(e){}
    for (const i of list) {
      const name = i.name;
      console.log('Deleting', name);
      try { await httpReq('DELETE', `/instance/delete/${encodeURIComponent(name)}`); } catch(e){}
      try { await httpReq('DELETE', `/instance/logout/${encodeURIComponent(name)}`); } catch(e){}
    }

    console.log('Restarting evolution-api container...');
    try { await run('docker-compose restart evolution-api'); } catch(e){ console.error('docker restart failed', e); }
    await new Promise(r=>setTimeout(r,8000));

    const name = 'bot-ventas-scan';
    console.log('Creating instance', name);
    try {
      const create = await httpReq('POST','/instance/create',{ instanceName: name, qrcode: true, integration: 'WHATSAPP-BAILEYS' });
      console.log('create status', create.status);
    } catch(e) { console.error('create error', e); }

    console.log('Polling for QR (up to 180s)...');
    const timeout = 180;
    const start = Date.now();
    while ((Date.now() - start)/1000 < timeout) {
      try {
        const r = await httpReq('GET', `/instance/connect/${encodeURIComponent(name)}`);
        if (r.status===200) {
          try {
            const data = JSON.parse(r.body);
            let base64 = null;
            if (data) {
              if (data.qrcode && data.qrcode.base64) base64 = data.qrcode.base64;
              else if (data.data && Array.isArray(data.data) && data.data.length>0) {
                for (const d of data.data) if (d && d.qrcode && d.qrcode.base64) { base64 = d.qrcode.base64; break; }
              }
            }
            if (base64) {
              const pngPath = `evolution/${name}-qr.png`;
              const htmlPath = `evolution/${name}-qr.html`;
              fs.writeFileSync(pngPath, Buffer.from(base64,'base64'));
              fs.writeFileSync(htmlPath, `<html><body style=\"display:flex;align-items:center;justify-content:center;height:100vh\"><img src=\"data:image/png;base64,${base64}\"/></body></html>`, 'utf8');
              console.log('FOUND', pngPath, htmlPath);
              try { await run(`powershell -NoProfile -Command Start-Process -FilePath "${process.cwd()}\\${htmlPath}"`); } catch(e) { console.error('open failed', e.stdout||e); }
              process.exit(0);
            }
          } catch(e) { }
        }
      } catch(e) { }
      await new Promise(r=>setTimeout(r,2000));
    }
    console.log('NO_QR_FOUND');
    process.exit(2);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(3);
  }
})();
