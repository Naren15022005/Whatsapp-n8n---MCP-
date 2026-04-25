const http = require('http');
const https = require('https');
const url = require('url');
const { argv, env } = require('process');

function getArg(name, short) {
  const idx = argv.findIndex(a => a === `--${name}` || (short && a === `-${short}`));
  if (idx === -1) return null;
  return argv[idx+1] && !argv[idx+1].startsWith('-') ? argv[idx+1] : true;
}

const API_HOST = process.env.EVOLUTION_API_HOST || 'http://localhost:8080';
const API_KEY = process.env.EVOLUTION_API_KEY || getArg('apikey', 'k');
const DRY = getArg('dry-run', 'd') !== null ? !(getArg('dry-run', 'd') === 'false' || getArg('dry-run', 'd') === '0') : true;
const DELETE = getArg('delete', null) !== null;
const OLDER_THAN_DAYS = parseInt(getArg('older-than', null) || '0', 10);

if (!API_KEY) {
  console.error(JSON.stringify({ success: false, error: 'EVOLUTION_API_KEY no definido. Exportalo como env EVOLUTION_API_KEY o usa --apikey <key>' }));
  process.exit(1);
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(API_HOST + path);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      }
    };

    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function fetchInstances() {
  const r = await request('GET', '/instance/fetchInstances');
  if (r.status !== 200) throw new Error('fetchInstances failed: ' + JSON.stringify(r));
  return r.body.value || r.body || [];
}

function isOlderThan(dateStr, days) {
  if (!days || days <= 0) return false;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return false;
  const cutoff = Date.now() - days * 24 * 3600 * 1000;
  return then < cutoff;
}

async function run() {
  console.log(JSON.stringify({ info: 'Fetching instances', dryRun: DRY, deleteFlag: DELETE, olderThanDays: OLDER_THAN_DAYS }));
  const instances = await fetchInstances();

  const toRemove = instances.filter(inst => {
    // remove if not open OR explicitly older than threshold
    const notOpen = inst.connectionStatus !== 'open';
    const older = OLDER_THAN_DAYS ? isOlderThan(inst.updatedAt || inst.createdAt || inst.createdAt, OLDER_THAN_DAYS) : false;
    return notOpen || older;
  });

  if (!toRemove.length) {
    console.log(JSON.stringify({ success: true, message: 'No hay instancias para limpiar' }));
    return;
  }

  console.log(JSON.stringify({ info: 'Instancias candidatas', count: toRemove.length, samples: toRemove.slice(0,10).map(i=>({name:i.name, status:i.connectionStatus, owner:i.ownerJid})) }));

  if (DRY && !DELETE) {
    console.log(JSON.stringify({ dryRun: true, details: toRemove.map(i=>({ name: i.name, status: i.connectionStatus })) }));
    return;
  }

  for (const inst of toRemove) {
    try {
      if (DRY) {
        console.log(JSON.stringify({ dryRunDelete: inst.name }));
        continue;
      }
      if (!DELETE) {
        console.log(JSON.stringify({ skipDelete: inst.name, reason: 'use --delete to actually delete' }));
        continue;
      }
      const del = await request('DELETE', `/instance/delete/${encodeURIComponent(inst.name)}`);
      console.log(JSON.stringify({ deleted: inst.name, status: del.status, body: del.body }));
    } catch (e) {
      console.error(JSON.stringify({ error: 'delete failed', name: inst.name, details: e.message }));
    }
  }
}

run().catch(e => {
  console.error(JSON.stringify({ success: false, error: e.message }));
  process.exit(1);
});
