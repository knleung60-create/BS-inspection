import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Generate Site Memo PDF from selected defects
export const generateSiteMemo = async (defects, projectTitle) => {
  if (!defects || defects.length === 0) {
    throw new Error('No defects provided');
  }

  // Get current date
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('en-GB');
  
  // Calculate deadline (current date + 14 days)
  const deadlineDate = new Date(currentDate);
  deadlineDate.setDate(deadlineDate.getDate() + 14);
  const deadlineStr = deadlineDate.toLocaleDateString('en-GB');
  
  // Generate Site Memo number (using timestamp for uniqueness)
  const memoNumber = `HTS/MC/SM/${Date.now().toString().slice(-6)}`;
  
  // Group defects by service type for better organization
  const defectsByType = {};
  defects.forEach(defect => {
    if (!defectsByType[defect.serviceType]) {
      defectsByType[defect.serviceType] = [];
    }
    defectsByType[defect.serviceType].push(defect);
  });
  
  // Read defect photos (if any) and convert to base64 data URIs so they can be embedded in the PDF
  const defectsWithPhotos = await Promise.all(defects.map(async (defect) => {
    let photoDataUri = null;
    try {
      if (defect.photoPath) {
        const parts = defect.photoPath.split('.');
        const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'jpg';
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        const base64 = await FileSystem.readAsStringAsync(defect.photoPath, { encoding: FileSystem.EncodingType.Base64 });
        photoDataUri = `data:${mime};base64,${base64}`;
      }
    } catch (err) {
      console.warn('Unable to read defect photo for embedding:', defect.defectId || defect.location, err);
      photoDataUri = null;
    }
    return { ...defect, photoDataUri };
  }));
  
  // Generate defects table rows
  const defectRows = defectsWithPhotos.map((defect, index) => `
    <tr>
      <td style="border: 1px solid #000; padding: 8px; text-align: left;">${defect.serviceType}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: left;">${defect.category}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: left;">${defect.location}</td>
    </tr>
  `).join('');
  
  // Get unique service types for subject line
  const uniqueTypes = [...new Set(defects.map(d => d.serviceType))];
  const tradeText = uniqueTypes.length === 1 ? uniqueTypes[0] : 'Multiple Trades';

  // Try to load a generated template module (utils/siteMemoTemplate.js) created by scripts/convert_docx_to_template.js
  let baseTemplate = null;
  try {
    // eslint-disable-next-line global-require
    const tmpl = require('./siteMemoTemplate');
    baseTemplate = tmpl && (tmpl.default || tmpl);
  } catch (e) {
    baseTemplate = null;
  }

  // Prepare defects summary HTML block
  // Helper to escape HTML in user-provided fields
  const escapeHtml = (str) => {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Build a detailed defects table (includes photo thumbnail and remarks)
  const defectsTableHtml = `
    <div class="section-title">Defects Summary</div>
    <table class="defects-table">
      <thead>
        <tr>
          <th style="width:5%;">No.</th>
          <th style="width:12%;">Defect ID</th>
          <th style="width:12%;">Trade</th>
          <th style="width:20%;">Category</th>
          <th style="width:18%;">Location</th>
          <th style="width:23%;">Remarks / Details</th>
          <th style="width:10%;">Photo</th>
        </tr>
      </thead>
      <tbody>
        ${defectsWithPhotos.map((d, idx) => `
          <tr>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${idx + 1}</td>
            <td style="border: 1px solid #000; padding: 6px;">${escapeHtml(d.defectId || '')}</td>
            <td style="border: 1px solid #000; padding: 6px;">${escapeHtml(d.serviceType || '')} ${escapeHtml(SERVICE_TYPE_NAMES[d.serviceType] || '')}</td>
            <td style="border: 1px solid #000; padding: 6px;">${escapeHtml(d.category || '')}</td>
            <td style="border: 1px solid #000; padding: 6px;">${escapeHtml(d.location || '')}</td>
            <td style="border: 1px solid #000; padding: 6px;">${escapeHtml(d.remarks || '')}<br/><small>${escapeHtml(d.createdAt || '')}</small></td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">
              ${d.photoDataUri ? `<img src="${d.photoDataUri}" style="max-width:120px;height:auto;border:1px solid #ddd;" />` : 'No photo'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="separator" style="border-bottom: 1px solid #000;"></div>
  `;

  const defectsSummaryHtml = defectsTableHtml;

  const photosHtml = defectsWithPhotos.map((d, i) => d.photoDataUri ? `
      <div class="section-title">Photo ${i + 1}: ${d.serviceType} - ${d.location}</div>
      <div><img src="${d.photoDataUri}" class="defect-photo" /></div>
    ` : '').join('');

  let html = '';
  if (baseTemplate) {
    // Replace a few common placeholders if present, otherwise we'll append content later
    html = baseTemplate
      .replace(/{{PROJECT_TITLE}}/g, projectTitle || 'N/A')
      .replace(/{{MEMO_NUMBER}}/g, memoNumber)
      .replace(/{{DATE}}/g, dateStr)
      .replace(/{{DEADLINE}}/g, deadlineStr)
      .replace(/{{SUBJECT}}/g, `Request ${tradeText} defects rectification`);

    // Replace DOCX-style placeholders commonly found in the user's template
    try {
      const uniqueCategories = [...new Set(defects.map(d => d.category).filter(Boolean))].join(', ');
      const locationsList = defects.map(d => d.location).filter(Boolean).join(', ');

      html = html.replace(/\[Insert Trade\]/gi, tradeText);
      html = html.replace(/\[Insert Defects Category\]/gi, uniqueCategories || '[Insert Defects Category]');
      html = html.replace(/\[Insert Location\]/gi, locationsList || '[Insert Location]');
      // Replace direct date placeholder with the extraction date
      html = html.replace(/\[Date of extract defects from defects log\]/gi, dateStr);
      // Replace combined 'insert date + 14 calendar days' patterns with computed deadline
      html = html.replace(/\[insert date[^[\]]*\[Date of extract defects from defects log\][^\]]*\+\s*14 calendar days[^\]]*\]/gi, deadlineStr);
      html = html.replace(/\[insert date[^\]]*\+\s*14 calendar days[^\]]*\]/gi, deadlineStr);
      // Fallback replacement for generic phrasing
      html = html.replace(/\[Date of extract defects from defects log\]\s*\+\s*14 calendar days/gi, deadlineStr);
      html = html.replace(/\[accumulate number extraction number\]/gi, memoNumber);
    } catch (e) {
      // Non-fatal: proceed even if replacements fail
      console.warn('Placeholder replacement warning:', e);
    }

    if (html.includes('{{DEFECTS_TABLE}}')) {
      html = html.replace(/{{DEFECTS_TABLE}}/g, defectsSummaryHtml);
    }

    if (html.includes('{{PHOTOS}}')) {
      html = html.replace(/{{PHOTOS}}/g, photosHtml);
    }

    // If neither placeholder exists, append the defects table and photos before </body>
    if (!html.includes(defectsSummaryHtml)) {
      html = html.replace(/<\/body>/i, `${defectsSummaryHtml}${photosHtml}</body>`);
    }
  } else {
    // Fallback: use the built-in layout (keeps previous look)
    html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @page { margin: 20mm; size: A4; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #000; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 18pt; font-weight: bold; margin-bottom: 10px; }
        .doc-title { font-size: 14pt; font-weight: bold; margin-bottom: 20px; }
        .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .info-table td { padding: 4px 8px; vertical-align: top; }
        .info-label { font-weight: bold; width: 120px; }
        .separator { border-bottom: 2px solid #000; margin: 20px 0; }
        .section-title { font-weight: bold; margin: 20px 0 10px 0; }
        .defects-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .defects-table th { border: 1px solid #000; padding: 8px; background-color: #f0f0f0; font-weight: bold; text-align: left; }
        .defects-table td { border: 1px solid #000; padding: 8px; text-align: left; }
        .defect-photo { max-width: 100%; height: auto; margin-bottom: 20px; border: 1px solid #ddd; }
        .body-text { margin: 15px 0; text-align: justify; }
        .signature-section { margin-top: 40px; }
        .signature-name { font-size: 14pt; font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
        .cc-section { margin-top: 30px; font-size: 10pt; }
        .cc-table { margin-top: 10px; }
        .cc-table td { padding: 2px 10px 2px 0; vertical-align: top; }
        .page-number { position: fixed; bottom: 10mm; right: 10mm; font-size: 10pt; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Vanke Property Agency Limited</div>
        <div class="doc-title">Site Memo</div>
      </div>
      <div class="separator"></div>
      <table class="info-table">
        <tr><td class="info-label">Project:</td><td>${projectTitle || 'N/A'}</td></tr>
        <tr><td class="info-label">Site Memo No:</td><td>${memoNumber}</td></tr>
        <tr><td class="info-label">Date:</td><td>${dateStr}</td></tr>
        <tr><td class="info-label">To:</td><td>Andrew Lee King Fun & Associates Architect Ltd</td></tr>
        <tr><td class="info-label">Attention:</td><td>Mr. Frankie Siu</td></tr>
        <tr><td class="info-label">From:</td><td>Mr. Leung Kit Nam</td></tr>
        <tr><td class="info-label">Total Pages:</td><td>1+1</td></tr>
        <tr><td class="info-label">Subject:</td><td><strong>Request ${tradeText} defects rectification</strong></td></tr>
      </table>
      <div class="separator"></div>
      <div class="body-text">We are writing to formally notify you of the following defects observed on-site, which require immediate rectification. Please find the details below:</div>
      <div class="separator" style="border-bottom: 1px solid #000;"></div>
      ${defectsSummaryHtml}
      ${photosHtml}
      <div class="body-text">The main contractor is requested to ensure that all the above defects are rectified and completed within <strong>14 calendar days</strong> (on or before <strong>${deadlineStr}</strong>).</div>
      <div class="body-text">Please urge the main contractor to supervise the subcontractor and take necessary action on this critical matter. We look forward to seeing the subcontractor's work improvement in the future.</div>
      <div class="signature-section"><div class="signature-name">Leung Kit Nam</div><div>Leung Kit Nam (HKS-AM) (Construction & Quality Control)</div><div>ksh/</div><div style="margin-top: 10px;">w/encl.</div></div>
      <div class="cc-section"><table class="cc-table"><tr><td style="width: 100px;"><strong>c.c</strong></td><td style="width: 100px;">Vanke</td><td>Mr. Ron Leung/ Mr. Noah Ting/ Mr. Eddie Cheung/ Mr. Jason Lee /<br/>Mr. Ray Lam/ Site Team</td></tr><tr><td></td><td>CCE(BS)</td><td>Ms. KK Wong</td></tr><tr><td></td><td>Wecon</td><td>Mr. Herman Tong/Anson Chan/C.K. Wong</td></tr></table></div>
      <div class="page-number">Page 1</div>
    </body>
    </html>
  `;
  }
  try {
    const { uri } = await Print.printToFileAsync({ html });
    const fileName = `SiteMemo_${memoNumber.replace(/\//g, '_')}_${Date.now()}.pdf`;
    const newPath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.moveAsync({
      from: uri,
      to: newPath,
    });
    
    return newPath;
  } catch (error) {
    console.error('Error generating site memo PDF:', error);
    throw error;
  }
};

// Share PDF file
export const sharePDF = async (uri) => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }
    await Sharing.shareAsync(uri);
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
};
