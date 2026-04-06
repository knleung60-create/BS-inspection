import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Generate Site Memo PDF from selected defects
export const generateSiteMemo = async (defects, projectTitle) => {
  if (!defects || defects.length === 0) {
    throw new Error('No defects provided');
  }

  // 1. 處理日期與 14 天後的期限 [cite: 5, 20]
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('en-GB');
  
  const deadlineDate = new Date(currentDate);
  deadlineDate.setDate(deadlineDate.getDate() + 14);
  const deadlineStr = deadlineDate.toLocaleDateString('en-GB');
  
  // 2. 生成符合新格式的 Site Memo 編號 [cite: 4]
  const memoNumber = `YTIL46/BSI/M/${Date.now().toString().slice(-4)}`;
  
  // 3. 動態生成缺失表格行 [cite: 15, 16, 17, 18]
  // 這裡會自動讀取 App 傳入的 defect 物件資訊
  const defectRows = defects.map((defect) => `
    <tr>
      <td style="border: 1px solid #000; padding: 8px; text-align: left;">${defect.serviceType}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: left;">${defect.category}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: left;">${defect.location}</td>
    </tr>
  `).join('');
  
  // 獲取唯一 Trade 類別用於標題 [cite: 10]
  const uniqueTypes = [...new Set(defects.map(d => d.serviceType))];
  const tradeText = uniqueTypes.length === 1 ? uniqueTypes[0] : 'Multiple Trades';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { margin: 20mm; size: A4; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #000; }
        .header { text-align: center; margin-bottom: 20px; }
        .company-name { font-size: 16pt; font-weight: bold; margin-bottom: 5px; }
        .doc-title { font-size: 14pt; font-weight: bold; text-decoration: underline; margin-bottom: 20px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .info-table td { padding: 4px 0; vertical-align: top; }
        .info-label { font-weight: bold; width: 130px; }
        .defects-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .defects-table th, .defects-table td { border: 1px solid #000; padding: 8px; text-align: left; }
        .defects-table th { background-color: #f2f2f2; font-weight: bold; }
        .signature-section { margin-top: 40px; }
        .cc-section { margin-top: 30px; font-size: 10pt; border-top: 1px solid #000; padding-top: 10px; }
        .cc-table td { padding: 2px 10px 2px 0; vertical-align: top; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Charm Smart Development Limited</div> <div class="doc-title">Site Memo</div> </div>
      
      <table class="info-table">
        <tr>
          <td class="info-label">Project:</td>
          <td>Proposed Development at YTIL 46, Yau Tong, Kowloon – Main Contract</td> </tr>
        <tr>
          <td class="info-label">Site Memo No:</td>
          <td>${memoNumber}</td> </tr>
        <tr>
          <td class="info-label">Date:</td>
          <td>${dateStr}</td> </tr>
        <tr>
          <td class="info-label">To:</td>
          <td>Chevalier Construction (Hong Kong) Limited</td> </tr>
        <tr>
          <td class="info-label">Attention:</td>
          <td>Mr. Cyrous Lam, Simon Tam, Steve Wong, Sky Ng</td> </tr>
        <tr>
          <td class="info-label">From:</td>
          <td>Mr. Leung Kit Nam</td> </tr>
        <tr>
          <td class="info-label">Total Pages:</td>
          <td>1+1</td> </tr>
        <tr>
          <td class="info-label">Subject:</td>
          <td><strong>Request ${tradeText} defects rectification</strong></td> </tr>
      </table>
      
      <p>We are writing to formally notify you of the following defects observed on-site, which require immediate rectification. [cite: 11] Please find the details below: [cite: 12]</p>
      
      <table class="defects-table">
        <thead>
          <tr>
            <th style="width: 30%;">Trade of Contractor</th> <th style="width: 35%;">Defects Category</th> <th style="width: 35%;">Location</th> </tr>
        </thead>
        <tbody>
          ${defectRows} </tbody>
      </table>
      
      <p>The main contractor is requested to ensure that all the above defects are rectified and completed within <strong>14 calendar days</strong> (on or before <strong>${deadlineStr}</strong>). </p>
      
      <p>The main contractor is urged to supervise the associated subcontractor and take necessary action on this matter. [cite: 21] We look forward to seeing the subcontractor's work improvement in the future. [cite: 22]</p>
      
      <div class="signature-section">
        <div style="font-weight: bold; font-size: 12pt;">Leung Kit Nam</div> <div>Building Services Inspector</div> <div>lkn/</div> <div>w/encl.</div> </div>
      
      <div class="cc-section">
        <table class="cc-table">
          <tr>
            <td style="width: 80px;"><strong>c.c</strong></td>
            <td style="width: 100px;">Vanke</td>
            <td>Ms. Lilian Lam, Mr. Ricky Pang, Mr. Ho Yiu Kai, Ms. Kelly Pan, Mr. Dennis Yung</td> </tr>
          <tr>
            <td></td>
            <td>P&T</td>
            <td>Mr. Tom Kwan, Ms Elsie Tsang</td> </tr>
          <tr>
            <td></td>
            <td>Aurecon (BS)</td>
            <td>Mr. Vincent Man, Mr. Michael Lui, Mr. Wise Man</td> </tr>
          <tr>
            <td></td>
            <td>Aurecon (Structure)</td>
            <td>Mr. Ken Chan, Mr. Stewart Liu, Ms. Renee Cheng</td> </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    const fileName = `SiteMemo_YTIL46_${Date.now()}.pdf`;
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
    if (!isAvailable) throw new Error('Sharing not available');
    await Sharing.shareAsync(uri);
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
};