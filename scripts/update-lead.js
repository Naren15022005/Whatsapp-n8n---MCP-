const fs = require('fs');
const path = require('path');

// Leer argumentos
const leadId = process.argv[2];
let updatesArg = process.argv[3];
let updates = {};
try {
  if (!updatesArg || updatesArg === '{}') {
    updates = {};
  } else if (updatesArg === '-') {
    // read from stdin
    const stdin = fs.readFileSync(0, 'utf8');
    updates = JSON.parse(stdin || '{}');
  } else if (updatesArg.startsWith('@')) {
    const filePath = path.isAbsolute(updatesArg.slice(1)) ? updatesArg.slice(1) : path.join(process.cwd(), updatesArg.slice(1));
    if (!fs.existsSync(filePath)) {
      console.error(JSON.stringify({ success: false, error: 'archivo de updates no encontrado', path: filePath }));
      process.exit(1);
    }
    updates = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    updates = JSON.parse(updatesArg);
  }
} catch (e) {
  console.error(JSON.stringify({ success: false, error: 'JSON inválido en argumentos', details: e.message }));
  process.exit(1);
}

// Leer JSON actual
const leadsPath = path.join(__dirname, '..', 'data', 'leads.json');
if (!fs.existsSync(leadsPath)) {
  console.error(JSON.stringify({ success: false, error: 'leads.json no encontrado', path: leadsPath }));
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));

// Encontrar y actualizar el lead
const leadIndex = data.leads.findIndex(l => l.id === parseInt(leadId));
if (leadIndex !== -1) {
    data.leads[leadIndex] = {
        ...data.leads[leadIndex],
        ...updates,
        contactado: true,
        fecha_contacto: new Date().toISOString().split('T')[0]
    };
    
    // Guardar
    fs.writeFileSync(leadsPath, JSON.stringify(data, null, 2));
    console.log(JSON.stringify({ success: true, lead: data.leads[leadIndex] }));
} else {
    console.error(JSON.stringify({ success: false, error: 'Lead no encontrado' }));
    process.exit(1);
}
