import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatDate = (date) => date.toLocaleDateString('en-GB');

const buildMemoNumber = (siteMemoNumber) => {
  const trimmed = siteMemoNumber.trim();
  return trimmed.toUpperCase().startsWith('YTIL46/BSI/M/')
    ? trimmed
    : `YTIL46/BSI/M/${trimmed}`;
};

const getImageBase64 = async (uri) => {
  try {
    let imageUri = uri;

    if (/^https?:\/\//i.test(uri)) {
      const fileName = `site_memo_photo_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const downloaded = await FileSystem.downloadAsync(uri, `${FileSystem.cacheDirectory}${fileName}`);
      imageUri = downloaded.uri;
    }

    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error converting site memo photo to base64:', error);
    return null;
  }
};

const makeFileSafeName = (value) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

// Generate a Site Memo PDF from selected defects using the attached memo format.
export const generateSiteMemo = async (defects, projectTitle, siteMemoNumber) => {
  if (!defects || defects.length === 0) {
    throw new Error('No defects provided');
  }

  if (!siteMemoNumber || !siteMemoNumber.trim()) {
    throw new Error('Site memo number is required');
  }

  const currentDate = new Date();
  const dateStr = formatDate(currentDate);
  const deadlineDate = new Date(currentDate);
  deadlineDate.setDate(deadlineDate.getDate() + 14);
  const deadlineStr = formatDate(deadlineDate);
  const memoNumber = buildMemoNumber(siteMemoNumber);

  const uniqueTypes = [...new Set(defects.map(d => d.serviceType).filter(Boolean))];
  const tradeText = uniqueTypes.length === 1 ? uniqueTypes[0] : 'multiple trades';

  const defectRows = defects.map((defect) => `
    <tr>
      <td>${escapeHtml(defect.serviceType || '')}</td>
      <td>${escapeHtml(defect.category || '')}</td>
      <td>${escapeHtml(defect.location || '')}</td>
    </tr>
  `).join('');

  const photoRows = await Promise.all(defects.map(async (defect, index) => {
    let photoHtml = '<div class="no-photo">No photo provided</div>';

    if (defect.photoPath) {
      const photoBase64 = await getImageBase64(defect.photoPath);
      if (photoBase64) {
        photoHtml = `<img src="${photoBase64}" class="defect-photo" />`;
      }
    }

    return `
      <section class="photo-record">
        <div class="photo-meta">
          <strong>${index + 1}. ${escapeHtml(defect.defectId || '')}</strong>
          <span>${escapeHtml(defect.serviceType || '')}</span>
        </div>
        <div class="photo-details">
          <div><strong>Defect Category:</strong> ${escapeHtml(defect.category || '')}</div>
          <div><strong>Location:</strong> ${escapeHtml(defect.location || '')}</div>
          ${defect.remarks ? `<div><strong>Remarks:</strong> ${escapeHtml(defect.remarks)}</div>` : ''}
        </div>
        <div class="photo-box">${photoHtml}</div>
      </section>
    `;
  }));

  const project = projectTitle && projectTitle !== 'All'
    ? projectTitle
    : 'Proposed Development at YTIL 46, Yau Tong, Kowloon - Main Contract';

  const totalPagesText = `1+${Math.max(1, defects.length)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          margin: 16mm;
          size: A4;
        }

        body {
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11pt;
          line-height: 1.35;
          margin: 0;
        }

        .company {
          font-size: 18pt;
          font-weight: 700;
          text-align: center;
          margin-bottom: 10mm;
        }

        .memo-title {
          font-size: 14pt;
          font-weight: 700;
          text-align: center;
          text-decoration: underline;
          margin-bottom: 8mm;
        }

        .memo-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6mm;
        }

        .memo-table td {
          padding: 2.5mm 1mm;
          vertical-align: top;
        }

        .memo-label {
          font-weight: 700;
          width: 32mm;
          white-space: nowrap;
        }

        .rule {
          border-bottom: 1px solid #000;
          margin: 5mm 0;
        }

        .body-text {
          margin: 4mm 0;
          text-align: justify;
        }

        .summary-title {
          font-weight: 700;
          margin: 5mm 0 3mm;
        }

        .defects-table {
          width: 100%;
          border-collapse: collapse;
          margin: 3mm 0 5mm;
        }

        .defects-table th,
        .defects-table td {
          border: 1px solid #000;
          padding: 2.5mm;
          text-align: left;
          vertical-align: top;
        }

        .defects-table th {
          background: #efefef;
          font-weight: 700;
        }

        .signature {
          margin-top: 9mm;
        }

        .signature-name {
          font-weight: 700;
          text-decoration: underline;
          margin-bottom: 1mm;
        }

        .cc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5pt;
          margin-top: 5mm;
        }

        .cc-table td {
          padding: 1mm 2mm 1mm 0;
          vertical-align: top;
        }

        .appendix {
          page-break-before: always;
        }

        .appendix-title {
          font-size: 14pt;
          font-weight: 700;
          margin-bottom: 4mm;
        }

        .photo-record {
          page-break-inside: avoid;
          border: 1px solid #999;
          margin-bottom: 7mm;
          padding: 4mm;
        }

        .photo-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3mm;
        }

        .photo-details {
          margin-bottom: 3mm;
        }

        .photo-box {
          text-align: center;
        }

        .defect-photo {
          max-width: 100%;
          max-height: 118mm;
          object-fit: contain;
          border: 1px solid #ccc;
        }

        .no-photo {
          border: 1px dashed #aaa;
          color: #666;
          padding: 18mm;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="company">Charm Smart Development Limited</div>
      <div class="memo-title">Site Memo</div>

      <table class="memo-table">
        <tr><td class="memo-label">Project:</td><td>${escapeHtml(project)}</td></tr>
        <tr><td class="memo-label">Site Memo No:</td><td>${escapeHtml(memoNumber)}</td></tr>
        <tr><td class="memo-label">Date:</td><td>${escapeHtml(dateStr)}</td></tr>
        <tr><td class="memo-label">To:</td><td>Chevalier Construction (Hong Kong) Limited</td></tr>
        <tr><td class="memo-label">Attention:</td><td>Mr. Cyrous Lam, Simon Tam, Steve Wong, Benny Chan</td></tr>
        <tr><td class="memo-label">From:</td><td>Mr. Leung Kit Nam</td></tr>
        <tr><td class="memo-label">Total Pages:</td><td>${escapeHtml(totalPagesText)}</td></tr>
        <tr><td class="memo-label">Subject:</td><td><strong>Request ${escapeHtml(tradeText)} defects rectification</strong></td></tr>
      </table>

      <div class="rule"></div>

      <p class="body-text">
        We are writing to formally notify you of the following defects observed on-site, which require immediate rectification.
        Please find the details below:
      </p>

      <div class="rule"></div>
      <div class="summary-title">Defects Summary</div>

      <table class="defects-table">
        <thead>
          <tr>
            <th style="width: 24%;">Trade of Contractor</th>
            <th style="width: 38%;">Defects Category</th>
            <th style="width: 38%;">Location</th>
          </tr>
        </thead>
        <tbody>${defectRows}</tbody>
      </table>

      <div class="rule"></div>

      <p class="body-text">
        The main contractor is requested to ensure that all the above defects are rectified and completed within
        <strong>14 calendar days</strong> (on or before <strong>${escapeHtml(deadlineStr)}</strong>).
      </p>

      <p class="body-text">
        The main contractor is urged to supervise the associated subcontractor and take necessary action on this matter.
        We look forward to seeing the subcontractor's work improvement in the future.
      </p>

      <div class="signature">
        <div class="signature-name">Leung Kit Nam</div>
        <div>Building Services Inspector</div>
        <div>lkn/</div>
        <div style="margin-top: 3mm;">w/encl.</div>
      </div>

      <table class="cc-table">
        <tr>
          <td style="width: 18mm;"><strong>c.c</strong></td>
          <td style="width: 25mm;">Vanke</td>
          <td>Mr. Jimmy Leung, Mr. Ken Tsang, Ms. Lilian Lam, Mr. Ricky Pang, Mr. Ho Yiu Kai, Ms. Kelly Pan, Mr. Dennis Yung</td>
        </tr>
        <tr><td></td><td>P&amp;T</td><td>Mr. Tom Kwan, Ms Elsie Tsang</td></tr>
        <tr><td></td><td>Aurecon (BS)</td><td>Mr. Kevin Lai</td></tr>
        <tr><td></td><td>Aurecon (Structure)</td><td>Mr. Ken Chan, Mr. Stewart Liu, Ms. Renee Cheng</td></tr>
      </table>

      <div class="appendix">
        <div class="appendix-title">Defect List with Photos</div>
        ${photoRows.join('')}
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    const fileName = `SiteMemo_${makeFileSafeName(memoNumber)}_${Date.now()}.pdf`;
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

export const sharePDF = async (uri) => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }
    await Sharing.shareAsync(uri);
  } catch (error) {
    console.error('Error sharing site memo PDF:', error);
    throw error;
  }
};
