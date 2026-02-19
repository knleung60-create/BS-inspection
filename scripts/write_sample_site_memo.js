const fs = require('fs');
const path = require('path');
const template = require('../utils/siteMemoTemplate');

// Sample defects
const defects = [
  {
    defectId: 'D-001',
    serviceType: 'PD',
    category: 'Water pipes routing incorrect',
    location: 'Flat 12A',
    remarks: 'Leak observed near riser',
    photoDataUri: null,
    createdAt: new Date().toISOString(),
  },
  {
    defectId: 'D-002',
    serviceType: 'EL',
    category: 'Ceiling junction boxes location incorrect',
    location: 'Flat 12B',
    remarks: 'Box not centered',
    photoDataUri: null,
    createdAt: new Date().toISOString(),
  }
];

const escapeHtml = (str) => {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const defectRows = defects.map((d, idx) => `
<tr>
  <td style="border:1px solid #000;padding:6px;">${idx+1}</td>
  <td style="border:1px solid #000;padding:6px;">${escapeHtml(d.defectId)}</td>
  <td style="border:1px solid #000;padding:6px;">${escapeHtml(d.serviceType)}</td>
  <td style="border:1px solid #000;padding:6px;">${escapeHtml(d.category)}</td>
  <td style="border:1px solid #000;padding:6px;">${escapeHtml(d.location)}</td>
  <td style="border:1px solid #000;padding:6px;">${escapeHtml(d.remarks)}</td>
  <td style="border:1px solid #000;padding:6px;">No photo</td>
</tr>
`).join('');

const defectsTableHtml = `\n<div class="section-title">Defects Summary</div>\n<table class="defects-table">\n<thead>\n<tr>\n<th>No.</th><th>Defect ID</th><th>Trade</th><th>Category</th><th>Location</th><th>Remarks</th><th>Photo</th>\n</tr>\n</thead>\n<tbody>${defectRows}</tbody>\n</table>\n`;

let html = template
  .replace(/\{\{PROJECT_TITLE\}\}/g, 'Sample Project')
  .replace(/\{\{MEMO_NUMBER\}\}/g, 'SAMPLE/0001')
  .replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString('en-GB'))
  .replace(/\{\{DEADLINE\}\}/g, new Date(Date.now()+14*24*3600*1000).toLocaleDateString('en-GB'))
  .replace(/\{\{SUBJECT\}\}/g, 'Request Multiple Trades defects rectification');

if (html.includes('{{DEFECTS_TABLE}}')) {
  html = html.replace(/\{\{DEFECTS_TABLE\}\}/g, defectsTableHtml);
} else {
  html = html.replace(/<\/body>/i, `${defectsTableHtml}</body>`);
}

const outDir = path.resolve(__dirname, 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `sample_site_memo_${Date.now()}.html`);
fs.writeFileSync(outPath, html, 'utf8');
console.log('Sample site memo HTML written to', outPath);
