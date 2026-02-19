const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const inputPath = path.resolve(__dirname, '..', 'assets', 'templates', 'General_defects_site_memo.docx');
    if (!fs.existsSync(inputPath)) {
      console.error('DOCX template not found at:', inputPath);
      process.exit(1);
    }

    const result = await mammoth.convertToHtml({ path: inputPath });
    let html = result.value || '';

    // Escape backticks to safely embed in template literal
    html = html.replace(/`/g, '\\`');

    const outPath = path.resolve(__dirname, '..', 'utils', 'siteMemoTemplate.js');
    const moduleContent = `// Auto-generated from DOCX by scripts/convert_docx_to_template.js\nmodule.exports = ` + "`" + html + "`" + ";\n";

    fs.writeFileSync(outPath, moduleContent, 'utf8');
    console.log('siteMemoTemplate generated at', outPath);
  } catch (err) {
    console.error('Error converting DOCX to template:', err);
    process.exit(1);
  }
})();
