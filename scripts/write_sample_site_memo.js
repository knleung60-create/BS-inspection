const fs = require('fs');
const path = require('path');
const template = require('../utils/siteMemoTemplate');

// Helper to escape HTML
const escapeHtml = (str) => {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

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

const currentDate = new Date();
const dateStr = currentDate.toLocaleDateString('en-GB');
const deadlineDate = new Date(currentDate);
deadlineDate.setDate(deadlineDate.getDate() + 14);
const deadlineStr = deadlineDate.toLocaleDateString('en-GB');
const memoNumber = `HTS/MC/SM/${Date.now().toString().slice(-6)}`;
const projectTitle = 'Sample Project';
const uniqueTypes = [...new Set(defects.map(d => d.serviceType))];
const tradeText = uniqueTypes.length === 1 ? uniqueTypes[0] : 'Multiple Trades';

console.log('Sample memo generation with placeholders:');
console.log('  Project:', projectTitle);
console.log('  Memo #:', memoNumber);
console.log('  Date:', dateStr);
console.log('  Deadline:', deadlineStr);
console.log('  Trade:', tradeText);
console.log('  Defects:', defects.length);

let html = template;

// STEP 1: Replace global placeholders
console.log('\nStep 1: Replacing global placeholders...');
html = html
  .replace(/{{PROJECT_TITLE}}/g, projectTitle)
  .replace(/{{MEMO_NUMBER}}/g, memoNumber)
  .replace(/{{DATE}}/g, dateStr)
  .replace(/{{DEADLINE}}/g, deadlineStr)
  .replace(/{{SUBJECT}}/g, `Request ${tradeText} defects rectification`);

html = html.replace(/\[accumulate number extraction number\]/gi, memoNumber);
html = html.replace(/\[Date of extract defects from defects log\]/gi, dateStr);
html = html.replace(/\[.*?Date of extract defects from defects log.*?\+\s*14 calendar days.*?\]/gi, deadlineStr);
html = html.replace(/\[.*?insert date.*?\+\s*14 calendar days.*?\]/gi, deadlineStr);
console.log('  ✓ Global placeholders replaced');

// STEP 2: Populate embedded defects table
console.log('\nStep 2: Populating embedded defects table...');
try {
  const defectsTableRegex = /<table[^>]*>[\s\S]*?\[Defects Photo insert here\][\s\S]*?<\/table>/i;
  const tableMatch = html.match(defectsTableRegex);
  
  if (tableMatch) {
    const originalTable = tableMatch[0];
    console.log('  ✓ Found embedded defects table');
    
    let newTableRows = '';
    defects.forEach((d, idx) => {
      const photoCell = '<p>[No photo in sample]</p>';
      const detailsCell = `
        <p>
          <strong>${escapeHtml(d.serviceType)}</strong>
          ${escapeHtml(d.category)}<br/>
          <strong>Location:</strong> ${escapeHtml(d.location)}<br/>
          <small>${escapeHtml(d.remarks || '')}</small>
        </p>
      `;
      
      newTableRows += `
        <tr>
          <td style="vertical-align:top;padding:8px;">
            ${photoCell}
          </td>
          <td style="vertical-align:top;padding:8px;">
            ${detailsCell}
          </td>
        </tr>
      `;
    });
    
    const newTable = originalTable.replace(
      /<tbody[^>]*>[\s\S]*?<\/tbody>/i,
      `<tbody>${newTableRows}</tbody>`
    );
    html = html.replace(originalTable, newTable);
    console.log(`  ✓ Populated ${defects.length} defects in table`);
  }
} catch (err) {
  console.warn('  ✗ Error populating table:', err.message);
}

// STEP 3: Replace summary-level placeholders
console.log('\nStep 3: Replacing summary placeholders...');
const uniqueCategories = [...new Set(defects.map(d => d.category).filter(Boolean))].join(', ');
const locationsList = defects.map(d => d.location).filter(Boolean).join(', ');

html = html.replace(/\[Insert Trade\]/gi, tradeText);
html = html.replace(/\[Insert Defects Category\]/gi, uniqueCategories);
html = html.replace(/\[Insert Location\]/gi, locationsList);
console.log('  ✓ Summary placeholders replaced');

const outDir = path.resolve(__dirname, 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `sample_site_memo_${Date.now()}.html`);
fs.writeFileSync(outPath, html, 'utf8');
console.log('\n✓ Sample site memo HTML written to', outPath);
