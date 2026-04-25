const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Ensure directories
if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'));
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));

app.use(express.static('public'));
app.use(express.json());

// Upload CSV
app.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  const leads = [];
  const fileName = req.file.originalname || req.file.filename || '';
  const ext = path.extname(fileName).toLowerCase();

  // Handle DOCX files using mammoth
  if (ext === '.docx' || ext === '.doc' || ext === '.txt') {
    try {
      let text = '';
      if (ext === '.txt') {
        text = fs.readFileSync(req.file.path, 'utf8');
      } else {
        const result = await mammoth.extractRawText({ path: req.file.path });
        text = result.value || '';
      }
      const extracted = extractLeadsFromText(text);
      // merge and save leads
      const merged = saveLeadsToFile(extracted);
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      console.log(`[upload-docx] parsed ${extracted.length}, added ${merged.addedCount}, total ${merged.allLeads.length}`);
      return res.json({ success: true, parsed: extracted.length, added: merged.addedCount, stored: merged.allLeads.length, leads: merged.added.slice(0, 10) });
    } catch (e) {
      try { fs.unlinkSync(req.file.path); } catch (err) {}
      return res.status(500).json({ error: e.message });
    }
  }

  // Fallback: assume CSV
  const requiredColumns = ['nombre', 'telefono', 'categoria', 'ciudad'];
  let hasRequiredColumns = true;

    const csvParser = csv();
    const stream = fs.createReadStream(req.file.path).pipe(csvParser);

  csvParser.on('headers', (headers) => {
    const missingColumns = requiredColumns.filter(col =>
      !headers.some(h => h.toLowerCase().includes(col))
    );

    if (missingColumns.length > 0) {
      hasRequiredColumns = false;
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      stream.destroy();
      return res.status(400).json({
        error: `Faltan columnas requeridas: ${missingColumns.join(', ')}`,
        headers: headers
      });
    }
  });

  csvParser.on('data', (row) => {
    // flexible mapping: accept headers like nombre_negocio, name, title, telefono, phone, tel, etc.
    function getRowValue(row, candidates) {
      for (const k of Object.keys(row)) {
        const kl = k.toLowerCase();
        for (const c of candidates) {
          if (kl === c || kl.includes(c)) {
            const v = row[k];
            if (typeof v === 'string') return v.trim();
            return v;
          }
        }
      }
      return '';
    }

    const nombre = getRowValue(row, ['nombre', 'name', 'negocio', 'title']);
    const telefonoRaw = getRowValue(row, ['telefono', 'phone', 'tel', 'cel', 'mobile']);
    const categoria = getRowValue(row, ['categoria', 'category', 'type']);
    const ciudad = getRowValue(row, ['ciudad', 'city', 'location']);
    const web = getRowValue(row, ['web', 'website', 'url']);

    const lead = {
      id: leads.length + 1,
      nombre_negocio: nombre || '',
      telefono: formatPhone(telefonoRaw || ''),
      categoria: categoria || '',
      ciudad: ciudad || '',
      web: web || '',
      contactado: false,
      estado: 'pendiente',
      fecha_contacto: null,
      respuesta: null,
      plantilla_id: null,
      mensaje: null,
      mensaje_longitud: null,
      emoji_count: null
    };

    if (lead.nombre_negocio && lead.telefono) {
      leads.push(lead);
    }
  });

  csvParser.on('end', () => {
    if (!hasRequiredColumns) return;

    try {
      const merged = saveLeadsToFile(leads);
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      console.log(`[upload-csv] parsed ${leads.length}, added ${merged.addedCount}, total ${merged.allLeads.length}`);
      return res.json({ success: true, parsed: leads.length, added: merged.addedCount, stored: merged.allLeads.length, leads: merged.added.slice(0, 10) });
    } catch (e) {
      try { fs.unlinkSync(req.file.path); } catch (err) {}
      return res.status(500).json({ error: e.message });
    }
  });

  csvParser.on('error', (error) => {
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    res.status(500).json({ error: error.message });
  });
});

function extractLeadsFromText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const phoneRegex = /(\+?\d[\d\s\-\(\)\.]{6,}\d)/g;
  const leads = [];
  const seen = new Set();

  lines.forEach((line, idx) => {
    let m;
    while ((m = phoneRegex.exec(line)) !== null) {
      const rawPhone = m[0];
      const phone = formatPhone(rawPhone);
      if (!phone) continue;
      if (seen.has(phone)) continue;
      // Try to guess a name: previous non-phone line or current line without phone
      let name = '';
      // Search previous lines for a likely name
      for (let j = idx - 1; j >= 0; j--) {
        const candidate = lines[j];
        if (!phoneRegex.test(candidate) && candidate.length > 2) { name = candidate; break; }
      }
      if (!name) {
        // remove phone from current line
        name = line.replace(phoneRegex, '').trim();
      }

      const lead = {
        id: leads.length + 1,
        nombre_negocio: name || '',
        telefono: phone,
        categoria: '',
        ciudad: '',
        web: '',
        contactado: false,
        estado: 'pendiente',
        fecha_contacto: null,
        respuesta: null,
        plantilla_id: null,
        mensaje: null,
        mensaje_longitud: null,
        emoji_count: null
      };
      leads.push(lead);
      seen.add(phone);
    }
  });

  return leads;
}

// Helpers: load and save leads with dedup por teléfono
function loadLeadsFromFile() {
  const dataPath = path.join(__dirname, 'data', 'leads.json');
  if (!fs.existsSync(dataPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return Array.isArray(data.leads) ? data.leads : [];
  } catch (e) {
    console.error('Error leyendo data/leads.json:', e.message);
    return [];
  }
}

function saveLeadsToFile(newLeads) {
  const existing = loadLeadsFromFile();
  const existingPhones = new Set(existing.map(l => (l.telefono || '').toString()));
  const added = [];

  newLeads.forEach(nl => {
    const phone = (nl.telefono || '').toString();
    if (!phone) return;
    if (!existingPhones.has(phone)) {
      existing.push(nl);
      existingPhones.add(phone);
      added.push(nl);
    }
  });

  // Reassign sequential IDs
  existing.forEach((l, i) => l.id = i + 1);

  const dataPath = path.join(__dirname, 'data', 'leads.json');
  fs.writeFileSync(dataPath, JSON.stringify({ leads: existing }, null, 2));

  return { allLeads: existing, added, addedCount: added.length };
}

// Get leads
app.get('/leads', (req, res) => {
  const dataPath = path.join(__dirname, 'data', 'leads.json');
  if (!fs.existsSync(dataPath)) return res.json({ leads: [] });
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Trigger n8n workflow (simple POST)
app.post('/trigger-workflow', async (req, res) => {
  const payload = { action: 'start' };
  const data = JSON.stringify(payload);

  const options = {
    hostname: 'localhost',
    port: 5678,
    path: '/webhook/start-outreach',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const r = http.request(options, (resp) => {
    let body = '';
    resp.on('data', (chunk) => body += chunk);
    resp.on('end', () => res.json({ success: true, status: resp.statusCode, body }));
  });

  r.on('error', (err) => res.status(500).json({ error: err.message }));
  r.write(data);
  r.end();
});

function formatPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (!cleaned.startsWith('+') && !cleaned.startsWith('57')) {
    cleaned = '57' + cleaned;
  }
  if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
  return cleaned;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log('📊 Sube tu CSV de Google Maps y el sistema lo convierte automáticamente');
});
