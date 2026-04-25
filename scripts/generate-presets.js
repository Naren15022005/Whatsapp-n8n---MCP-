#!/usr/bin/env node
/*
  scripts/generate-presets.js

  Genera un archivo JSON con mensajes "predeterminados" (presets)
  a partir de las plantillas existentes en `message-generator.js`.

  Uso:
    node scripts/generate-presets.js --count=2000

  El script crea `data/presets.json` con el número solicitado.
*/

const mg = require('./message-generator');
const fs = require('fs');
const path = require('path');

const OUT_PATH = path.join(__dirname, '..', 'data', 'presets.json');

function parseCount() {
  const arg = process.argv.find(a => a.startsWith('--count='));
  if (arg) return Math.max(1, parseInt(arg.split('=')[1], 10) || 2000);
  const idx = process.argv.indexOf('--count');
  if (idx !== -1 && process.argv[idx + 1]) return Math.max(1, parseInt(process.argv[idx + 1], 10) || 2000);
  return 2000;
}

const desiredCount = parseCount();

const { saludos, presentaciones, contextosGenerales, contextosConWeb, contextosSinWeb, propuestas } = mg.templates;

const contexts = [].concat(contextosGenerales, contextosConWeb, contextosSinWeb);

// Construir combinaciones básicas
const combos = [];
for (let s of saludos) {
  for (let p of presentaciones) {
    for (let c of contexts) {
      for (let pr of propuestas) {
        const msg = `${s}\n${p} ${c} ${pr}`.replace(/\s+/g, ' ').trim();
        combos.push(msg);
      }
    }
  }
}

// Deduplicar y mezclar
const unique = Array.from(new Set(combos));

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

shuffle(unique);

const out = unique.slice(0, Math.min(desiredCount, unique.length));

// Si no alcanzamos el count (poco probable), crear variaciones simples
if (out.length < desiredCount) {
  const extras = [];
  const emojis = ['👋','🙂','🚀','💬','⭐'];
  let i = 0;
  while (out.length + extras.length < desiredCount) {
    const base = unique[i % unique.length];
    const variant = base + ' ' + emojis[i % emojis.length];
    extras.push(variant);
    i++;
  }
  out.push(...extras);
}

// Guardar
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');

console.log(`Generados ${out.length} presets en: ${OUT_PATH}`);
