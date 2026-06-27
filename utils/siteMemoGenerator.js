import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
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
  
  // Generate defects table rows
  const defectRows = defects.map((defect, index) => `
    <tr>
      <td style="border: 1px solid #000; padding: 8px; text-align: left;">${defect.serviceType}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: left;">${defect.category}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: left;">${defect.location}</td>
    </tr>
  `).join('');
  
  // Get unique service types for subject line
  const uniqueTypes = [...new Set(defects.map(d => d.serviceType))];
  const tradeText = uniqueTypes.length === 1 ? uniqueTypes[0] : 'Multiple Trades';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @page {
          margin: 20mm;
          size: A4;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .company-name {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .doc-title {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 20px;
        }
        
        .info-table {
          width: 100%;
          margin-bottom: 20px;
          border-collapse: collapse;
        }
        
        .info-table td {
          padding: 4px 8px;
          vertical-align: top;
        }
        
        .info-label {
          font-weight: bold;
          width: 120px;
        }
        
        .separator {
          border-bottom: 2px solid #000;
          margin: 20px 0;
        }
        
        .section-title {
          font-weight: bold;
          margin: 20px 0 10px 0;
        }
        
        .defects-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .defects-table th {
          border: 1px solid #000;
          padding: 8px;
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: left;
        }
        
        .defects-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        
        .body-text {
          margin: 15px 0;
          text-align: justify;
        }
        
        .signature-section {
          margin-top: 40px;
        }
        
        .signature-name {
          font-size: 14pt;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 5px;
        }
        
        .cc-section {
          margin-top: 30px;
          font-size: 10pt;
        }
        
        .cc-table {
          margin-top: 10px;
        }
        
        .cc-table td {
          padding: 2px 10px 2px 0;
          vertical-align: top;
        }
        
        .page-number {
          position: fixed;
          bottom: 10mm;
          right: 10mm;
          font-size: 10pt;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="company-name">Vanke Property Agency Limited</div>
        <div class="doc-title">Site Memo</div>
      </div>
      
      <div class="separator"></div>
      
      <!-- Information Section -->
      <table class="info-table">
        <tr>
          <td class="info-label">Project:</td>
          <td>${projectTitle || 'N/A'}</td>
        </tr>
        <tr>
          <td class="info-label">Site Memo No:</td>
          <td>${memoNumber}</td>
        </tr>
        <tr>
          <td class="info-label">Date:</td>
          <td>${dateStr}</td>
        </tr>
        <tr>
          <td class="info-label">To:</td>
          <td>Andrew Lee King Fun & Associates Architect Ltd</td>
        </tr>
        <tr>
          <td class="info-label">Attention:</td>
          <td>Mr. Frankie Siu</td>
        </tr>
        <tr>
          <td class="info-label">From:</td>
          <td>Mr. Leung Kit Nam</td>
        </tr>
        <tr>
          <td class="info-label">Total Pages:</td>
          <td>1+1</td>
        </tr>
        <tr>
          <td class="info-label">Subject:</td>
          <td><strong>Request ${tradeText} defects rectification</strong></td>
        </tr>
      </table>
      
      <div class="separator"></div>
      
      <!-- Body -->
      <div class="body-text">
        We are writing to formally notify you of the following defects observed on-site, which require 
        immediate rectification. Please find the details below:
      </div>
      
      <div class="separator" style="border-bottom: 1px solid #000;"></div>
      
      <!-- Defects Summary -->
      <div class="section-title">Defects Summary</div>
      
      <table class="defects-table">
        <thead>
          <tr>
            <th style="width: 25%;">Trade of Contractor</th>
            <th style="width: 35%;">Defects Category</th>
            <th style="width: 40%;">Location</th>
          </tr>
        </thead>
        <tbody>
          ${defectRows}
        </tbody>
      </table>
      
      <div class="separator" style="border-bottom: 1px solid #000;"></div>
      
      <!-- Deadline Statement -->
      <div class="body-text">
        The main contractor is requested to ensure that all the above defects are rectified and 
        completed within <strong>14 calendar days</strong> (on or before <strong>${deadlineStr}</strong>).
      </div>
      
      <!-- Closing Statement -->
      <div class="body-text">
        Please urge the main contractor to supervise the subcontractor and take necessary action on 
        this critical matter. We look forward to seeing the subcontractor's work improvement in the future.
      </div>
      
      <!-- Signature Section -->
      <div class="signature-section">
        <div class="signature-name">Leung Kit Nam</div>
        <div>Leung Kit Nam (HKS-AM) (Construction & Quality Control)</div>
        <div>ksh/</div>
        <div style="margin-top: 10px;">w/encl.</div>
      </div>
      
      <!-- CC Section -->
      <div class="cc-section">
        <table class="cc-table">
          <tr>
            <td style="width: 100px;"><strong>c.c</strong></td>
            <td style="width: 100px;">Vanke</td>
            <td>Mr. Ron Leung/ Mr. Noah Ting/ Mr. Eddie Cheung/ Mr. Jason Lee /<br/>
                Mr. Ray Lam/ Site Team</td>
          </tr>
          <tr>
            <td></td>
            <td>CCE(BS)</td>
            <td>Ms. KK Wong</td>
          </tr>
          <tr>
            <td></td>
            <td>Wecon</td>
            <td>Mr. Herman Tong/Anson Chan/C.K. Wong</td>
          </tr>
        </table>
      </div>
      
      <!-- Page Number -->
      <div class="page-number">Page 1</div>
    </body>
    </html>
  `;

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
