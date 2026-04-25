const fs = require('fs');

const dataPath = 'data/leads.json';
if (!fs.existsSync(dataPath)) {
  console.error('data/leads.json not found');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
if (!data.leads || !data.leads.length) {
  console.error('No leads found');
  process.exit(1);
}

const keys = Object.keys(data.leads[0]);
const csv = [
  keys.join(','),
  ...data.leads.map(l => keys.map(k => {
    const v = l[k];
    if (v === null || v === undefined) return '';
    return String(v).replace(/"/g, '""');
  }).join(','))
].join('\n');

fs.writeFileSync('data/leads.csv', csv);
console.log('Wrote data/leads.csv');
