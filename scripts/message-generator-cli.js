#!/usr/bin/env node
// CLI wrapper para usar el generador desde n8n (o desde la terminal)
const mg = require('./message-generator');
const fs = require('fs');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { lead: null, usePresets: false, file: null };
  args.forEach(arg => {
    if (arg.startsWith('--lead=')) opts.lead = arg.slice(7);
    else if (arg === '--usePresets' || arg === '--use-presets') opts.usePresets = true;
    else if (arg.startsWith('--file=')) opts.file = arg.slice(7);
  });
  return opts;
}

(async function main() {
  try {
    const opts = parseArgs();
    let lead = null;

    if (opts.lead) {
      try { lead = JSON.parse(opts.lead); } catch (e) { console.error('Error parsing --lead JSON:', e.message); process.exit(2); }
    } else if (opts.file) {
      const raw = fs.readFileSync(opts.file, 'utf8');
      lead = JSON.parse(raw);
    } else {
      // intentar leer stdin
      try {
        const stdin = fs.readFileSync(0, 'utf8');
        if (stdin && stdin.trim()) lead = JSON.parse(stdin);
      } catch (e) {
        // no hay stdin
      }
    }

    if (!lead) lead = {};

    const result = mg.generarMensaje(lead, { usePresets: opts.usePresets });
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
