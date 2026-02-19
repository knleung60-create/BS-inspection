import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { SERVICE_TYPE_NAMES } from '../constants/defectData';

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
  
  // Read defect photos (if any), create thumbnails and prepare stable URIs for the PDF
  const imagesDir = `${FileSystem.documentDirectory}site_memo_images/`;
  try {
    const existing = await FileSystem.readDirectoryAsync(imagesDir);
    // remove any previous temp images to avoid buildup
    await Promise.all(existing.map(name => FileSystem.deleteAsync(imagesDir + name).catch(()=>{})));
  } catch (e) {
    try {
      await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
    } catch (mkdirErr) {
      console.warn('Unable to create images directory for site memo:', mkdirErr);
    }
  }

  const defectsWithPhotos = await Promise.all(defects.map(async (defect, idx) => {
    let photoDataUri = null;
    try {
      if (defect.photoPath) {
        // create thumbnail using a max width in inches (preserve aspect ratio)
        const maxWidthInches = 3.0; // per user request
        const dpi = 96; // assume 96 DPI for screen-to-pixel conversion
        const maxWidthPx = Math.round(maxWidthInches * dpi);
        const manipResult = await ImageManipulator.manipulateAsync(
          defect.photoPath,
          [{ resize: { width: maxWidthPx } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
        );

        const fileName = `site_memo_${Date.now()}_${idx}.jpg`;
        const destPath = imagesDir + fileName;
        try {
          await FileSystem.copyAsync({ from: manipResult.uri, to: destPath });
          // Also copy the original full-resolution photo as an attachment
          let fullDest = null;
          try {
            const origParts = defect.photoPath.split('/');
            const origName = origParts[origParts.length - 1] || `orig_${idx}.jpg`;
            fullDest = imagesDir + `full_${Date.now()}_${idx}_` + origName;
            await FileSystem.copyAsync({ from: defect.photoPath, to: fullDest });
            // record attachment path later
          } catch (fullCopyErr) {
            // ignore full copy errors, we'll fallback to base64 if needed
            fullDest = null;
          }

          // On Android, try to get a content:// URI which WebView/Print can load
          if (Platform.OS === 'android' && FileSystem.getContentUriAsync) {
            try {
              const content = await FileSystem.getContentUriAsync(destPath);
              photoDataUri = content && content.uri ? content.uri : destPath;
            } catch (contentErr) {
              console.warn('getContentUriAsync failed, using file URI:', contentErr);
              photoDataUri = destPath;
            }
          } else {
            photoDataUri = destPath;
          }
          // attach full image path to defect for later writing
          if (fullDest) defect._fullPhotoPath = fullDest;
        } catch (copyErr) {
          // fallback: embed as base64 from thumbnail
          try {
            const base64 = await FileSystem.readAsStringAsync(manipResult.uri, { encoding: FileSystem.EncodingType.Base64 });
            photoDataUri = `data:image/jpeg;base64,${base64}`;
          } catch (readErr) {
            console.warn('Unable to read/copy defect photo for embedding:', defect.defectId || defect.location, readErr);
            photoDataUri = null;
          }
        }
      }
    } catch (err) {
      console.warn('Unable to process defect photo for embedding:', defect.defectId || defect.location, err);
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
              ${d.photoDataUri ? `<img src="${d.photoDataUri}" style="max-width:3in;height:auto;border:1px solid #ddd;" />` : 'No photo'}
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
      <div><img src="${d.photoDataUri}" class="defect-photo" style="max-width:3in;height:auto;" /></div>
    ` : '').join('');

  let html = '';
  // Check if template exists and has meaningful content (more than just module.exports)
  const hasValidTemplate = baseTemplate && baseTemplate.trim().length > 50;
  
  if (hasValidTemplate) {
    console.log('Using loaded DOCX template for site memo');
    // Start with template
    html = baseTemplate;

    // STEP 1: Replace global/document-level placeholders (these appear once in the memo)
    console.log('Replacing global placeholders...');
    html = html
      .replace(/{{PROJECT_TITLE}}/g, projectTitle || 'N/A')
      .replace(/{{MEMO_NUMBER}}/g, memoNumber)
      .replace(/{{DATE}}/g, dateStr)
      .replace(/{{DEADLINE}}/g, deadlineStr)
      .replace(/{{SUBJECT}}/g, `Request ${tradeText} defects rectification`);

    // Replace all instances of date/deadline placeholders globally
    html = html.replace(/\[accumulate number extraction number\]/gi, memoNumber);
    html = html.replace(/\[Date of extract defects from defects log\]/gi, dateStr);
    // Handle the compound date+14days placeholder (various formats)
    html = html.replace(/\[.*?Date of extract defects from defects log.*?\+\s*14 calendar days.*?\]/gi, deadlineStr);
    html = html.replace(/\[.*?insert date.*?\+\s*14 calendar days.*?\]/gi, deadlineStr);

    // STEP 2: Handle the embedded defects table separately
    // This table may have placeholders that need individual row population
    console.log('Processing embedded defects table...');
    try {
      // Find the defects table: look for a table with placeholder text like "[Defects Photo insert here]"
      const defectsTableRegex = /<table[^>]*>[\s\S]*?\[Defects Photo insert here\][\s\S]*?<\/table>/i;
      const tableMatch = html.match(defectsTableRegex);
      
      if (tableMatch) {
        const originalTable = tableMatch[0];
        console.log('Found embedded defects table in template, populating with actual defects');
        
        // The template table has a 2-column layout: photo on left, details on right
        // We need to create rows for EACH defect, replacing all placeholders
        let newTableRows = '';
        defectsWithPhotos.forEach((d, idx) => {
          // Photo cell: replace [Defects Photo insert here] with actual photo
          const photoCell = d.photoDataUri 
            ? `<img src="${d.photoDataUri}" style="max-width:2.5in;height:auto;border:1px solid #ddd;" />`
            : '<p>[No photo available]</p>';
          
          // Details cell: include Trade, Category, Location, Remarks
          const detailsCell = `
            <p>
              <strong>${escapeHtml(d.serviceType || '')}</strong>
              ${escapeHtml(d.category || '')}<br/>
              <strong>Location:</strong> ${escapeHtml(d.location || '')}<br/>
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
        
        // Replace tbody content while preserving table structure
        const newTable = originalTable.replace(
          /<tbody[^>]*>[\s\S]*?<\/tbody>/i,
          `<tbody>${newTableRows}</tbody>`
        );
        html = html.replace(originalTable, newTable);
        console.log(`Populated ${defectsWithPhotos.length} defects in table`);
      }
    } catch (tableErr) {
      console.warn('Error populating embedded defects table:', tableErr.message);
      // Continue anyway - the placeholders should still be replaced at document level
    }

    // STEP 3: Replace summary-level section placeholders (if any remain outside the table)
    // These are typically in the summary section BEFORE the table
    try {
      const uniqueCategories = [...new Set(defects.map(d => d.category).filter(Boolean))].join(', ');
      const locationsList = defects.map(d => d.location).filter(Boolean).join(', ');

      // Replace remaining [Insert Trade] placeholders (outside table) with aggregated values
      html = html.replace(/\[Insert Trade\]/gi, tradeText);
      html = html.replace(/\[Insert Defects Category\]/gi, uniqueCategories || 'Multiple Categories');
      html = html.replace(/\[Insert Location\]/gi, locationsList || 'Multiple Locations');
    } catch (summaryErr) {
      console.warn('Error replacing summary placeholders:', summaryErr.message);
    }

    if (html.includes('{{DEFECTS_TABLE}}')) {
      html = html.replace(/{{DEFECTS_TABLE}}/g, defectsSummaryHtml);
    }

    if (html.includes('{{PHOTOS}}')) {
      html = html.replace(/{{PHOTOS}}/g, photosHtml);
    }
  } else {
    console.log('Template invalid or empty. Using built-in fallback layout.');
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
    let uri;
    try {
      const res = await Print.printToFileAsync({ html });
      uri = res.uri;
    } catch (printErr) {
      console.error('Error printing site memo (first attempt):', printErr);
      // Retry without embedded images (some devices crash with large base64 images)
      try {
        const htmlWithoutImages = html.replace(/<img[^>]*src=["'][^"']+["'][^>]*>/g, '<div style="font-size:10pt;color:#666">[Photo omitted in this copy]</div>');
        const res2 = await Print.printToFileAsync({ html: htmlWithoutImages });
        uri = res2.uri;
        console.warn('Printed site memo without images as fallback');
      } catch (printErr2) {
        console.error('Error printing site memo (fallback without images):', printErr2);
        throw printErr2;
      }
    }
    const fileName = `SiteMemo_${memoNumber.replace(/\//g, '_')}_${Date.now()}.pdf`;
    const newPath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.moveAsync({
      from: uri,
      to: newPath,
    });

    // Write attachments metadata (full-resolution photos) alongside the PDF
    try {
      const attachments = defectsWithPhotos.map(d => d._fullPhotoPath).filter(Boolean);
      if (attachments.length > 0) {
        const attachPath = `${newPath}.attachments.json`;
        await FileSystem.writeAsStringAsync(attachPath, JSON.stringify(attachments, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
      }
    } catch (attachErr) {
      console.warn('Failed to write attachments metadata for site memo:', attachErr);
    }

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
