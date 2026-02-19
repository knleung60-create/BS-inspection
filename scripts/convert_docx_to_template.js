const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    // Load two DOCX files:
    // 1. General site memo template (main structure)
    // 2. Defects table template (table structure)
    const generalMemoPaths = [
      'C:\\Users\\user\\Desktop\\site memo templates\\General defects site memo (charm smart).docx',
      process.argv[2], // Allow override via argument
    ];
    
    const defectsTablePath = 'C:\\Users\\user\\Desktop\\site memo templates\\defects table.docx';

    let generalPath = null;
    for (const p of generalMemoPaths) {
      if (p && fs.existsSync(p)) {
        generalPath = p;
        break;
      }
    }

    if (!generalPath) {
      console.error('General memo template not found');
      process.exit(1);
    }

    if (!fs.existsSync(defectsTablePath)) {
      console.error('Defects table template not found');
      process.exit(1);
    }

    console.log('Converting general memo:', generalPath);
    console.log('Converting defects table:', defectsTablePath);

    const generalResult = await mammoth.convertToHtml({ path: generalPath });
    const defectsResult = await mammoth.convertToHtml({ path: defectsTablePath });

    let generalHtml = generalResult.value || '';
    let defectsTableHtml = defectsResult.value || '';

    // Extract just the table from defects document (remove extra content)
    const tableMatch = defectsTableHtml.match(/<table[^>]*>[\s\S]*?<\/table>/i);
    if (tableMatch) {
      defectsTableHtml = tableMatch[0];
      console.log('Extracted table structure from defects template');
    }

    // Wrap table in a div with a page break before it
    const wrappedTable = `
<!-- PAGE BREAK: Defects table should be on a separate page -->
<div style="page-break-before: always; break-before: page;"></div>
<div class="section-title">Defects Summary</div>
${defectsTableHtml}
<div class="separator" style="border-bottom: 1px solid #000;"></div>`;

    // Combine: insert defects table into general memo before </body> or at the end
    let combinedHtml = generalHtml;
    if (generalHtml.includes('</body>')) {
      combinedHtml = generalHtml.replace(/<\/body>/i, `${wrappedTable}</body>`);
    } else {
      combinedHtml = generalHtml + wrappedTable;
    }

    // Escape backticks to safely embed in template literal
    combinedHtml = combinedHtml.replace(/`/g, '\\`');

    const outPath = path.resolve(__dirname, '..', 'utils', 'siteMemoTemplate.js');
    const moduleContent = `// Auto-generated from DOCX by scripts/convert_docx_to_template.js\n// Combined: General defects site memo + Defects table\nmodule.exports = ` + "`" + combinedHtml + "`" + ";\n";

    fs.writeFileSync(outPath, moduleContent, 'utf8');
    console.log('siteMemoTemplate generated at', outPath);
  } catch (err) {
    console.error('Error converting DOCX to template:', err);
    process.exit(1);
  }
})();
