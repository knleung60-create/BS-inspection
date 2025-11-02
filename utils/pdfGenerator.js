import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { SERVICE_TYPE_NAMES } from '../constants/defectData';

// Convert image to base64 for embedding in PDF
const getImageBase64 = async (uri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

export const generateDefectLogPDF = async (defects, projectTitle = 'All Projects', filterType = 'All') => {
  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB');
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    // Group defects by service type for summary
    const summary = {};
    defects.forEach(defect => {
      if (!summary[defect.serviceType]) {
        summary[defect.serviceType] = 0;
      }
      summary[defect.serviceType]++;
    });
    
    const summaryRows = Object.keys(summary).map(type => `
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: 600;">${type}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${SERVICE_TYPE_NAMES[type]}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #1976d2;">${summary[type]}</td>
      </tr>
    `).join('');
    
    // Generate defect rows with photos
    const defectRowsPromises = defects.map(async (defect, index) => {
      const date = new Date(defect.createdAt);
      const formattedDate = date.toLocaleDateString('en-GB');
      const formattedTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      // Get photo as base64
      let photoHtml = '<td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #999;">No photo</td>';
      if (defect.photoPath) {
        const photoBase64 = await getImageBase64(defect.photoPath);
        if (photoBase64) {
          photoHtml = `
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
              <img src="${photoBase64}" style="max-width: 120px; max-height: 120px; border-radius: 4px; border: 1px solid #ddd;" />
            </td>
          `;
        }
      }
      
      return `
        <tr style="page-break-inside: avoid;">
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${index + 1}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            <div style="font-weight: bold; color: #1976d2; margin-bottom: 4px;">${defect.defectId}</div>
            <div style="font-size: 11px; color: #666;">
              <span style="display: inline-block; padding: 2px 8px; background-color: #e3f2fd; border-radius: 3px; font-weight: 600;">
                ${defect.serviceType}
              </span>
            </div>
          </td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            <div style="font-weight: 600; margin-bottom: 4px;">${defect.category}</div>
            <div style="font-size: 11px; color: #666;">${SERVICE_TYPE_NAMES[defect.serviceType]}</div>
          </td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            <div style="font-weight: 600; color: #333;">📍 ${defect.location}</div>
            ${defect.remarks ? `<div style="font-size: 11px; color: #666; margin-top: 4px; font-style: italic;">${defect.remarks}</div>` : ''}
          </td>
          ${photoHtml}
          <td style="padding: 10px; border: 1px solid #ddd; font-size: 11px; text-align: center;">
            <div style="font-weight: 600;">${formattedDate}</div>
            <div style="color: #666;">${formattedTime}</div>
          </td>
        </tr>
      `;
    });
    
    const defectRows = (await Promise.all(defectRowsPromises)).join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 15mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              font-size: 11px;
              color: #333;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: 700;
            }
            .subtitle {
              font-size: 14px;
              opacity: 0.95;
            }
            .info-box {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 20px;
              border-left: 4px solid #667eea;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: 700;
              width: 120px;
              color: #555;
            }
            .info-value {
              color: #333;
            }
            .summary-box {
              background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            h2 {
              color: #2e7d32;
              margin: 0 0 15px 0;
              font-size: 18px;
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              background-color: white;
            }
            th {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 10px;
              text-align: left;
              border: 1px solid #ddd;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              padding: 10px;
              border: 1px solid #ddd;
              vertical-align: top;
            }
            tr:nth-child(even) {
              background-color: #fafafa;
            }
            tr:hover {
              background-color: #f5f5f5;
            }
            .section-title {
              background-color: #f5f5f5;
              padding: 12px 15px;
              border-radius: 6px;
              margin: 25px 0 15px 0;
              border-left: 4px solid #667eea;
            }
            .section-title h2 {
              margin: 0;
              color: #333;
              font-size: 16px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #999;
              border-top: 2px solid #e0e0e0;
              padding-top: 15px;
            }
            .badge {
              display: inline-block;
              padding: 4px 10px;
              background-color: #e3f2fd;
              color: #1976d2;
              border-radius: 4px;
              font-weight: 600;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏗️ Building Services Inspection Report</h1>
            <div class="subtitle">Defect Log - Comprehensive Record</div>
          </div>
          
          <div class="info-box">
            <div class="info-row">
              <div class="info-label">Project:</div>
              <div class="info-value"><strong>${projectTitle}</strong></div>
            </div>
            <div class="info-row">
              <div class="info-label">Filter Applied:</div>
              <div class="info-value">${filterType === 'All' ? 'All Service Types' : `${filterType} - ${SERVICE_TYPE_NAMES[filterType]}`}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Total Defects:</div>
              <div class="info-value"><strong style="color: #d32f2f; font-size: 14px;">${defects.length}</strong></div>
            </div>
            <div class="info-row">
              <div class="info-label">Generated:</div>
              <div class="info-value">${dateStr} at ${timeStr}</div>
            </div>
          </div>
          
          <div class="summary-box">
            <h2>📊 Summary by Service Type</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%; text-align: center;">Type</th>
                  <th style="width: 60%;">Description</th>
                  <th style="width: 25%; text-align: center;">Count</th>
                </tr>
              </thead>
              <tbody>
                ${summaryRows}
              </tbody>
            </table>
          </div>
          
          <div class="section-title">
            <h2>📋 Detailed Defect Records</h2>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 15%;">Defect ID / Type</th>
                <th style="width: 20%;">Category</th>
                <th style="width: 25%;">Location / Remarks</th>
                <th style="width: 20%; text-align: center;">Photo</th>
                <th style="width: 15%; text-align: center;">Date / Time</th>
              </tr>
            </thead>
            <tbody>
              ${defectRows}
            </tbody>
          </table>
          
          <div class="footer">
            <p><strong>Building Services Inspection App</strong></p>
            <p>Generated on ${dateStr} at ${timeStr}</p>
            <p>This report contains ${defects.length} defect record(s) with photos and complete details</p>
            <p style="margin-top: 10px; color: #666;">
              Service Types: PD (Plumbing & Drainage) | FS (Fire Services) | EL (Electrical) | Bonding (Earthing Test) | MVAC (Mechanical Ventilation & Air Conditioning)
            </p>
          </div>
        </body>
      </html>
    `;
    
    const { uri } = await Print.printToFileAsync({ 
      html,
      base64: false 
    });
    
    const fileName = `DefectLog_${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    const newPath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.moveAsync({
      from: uri,
      to: newPath,
    });
    
    return newPath;
  } catch (error) {
    console.error('Error generating defect log PDF:', error);
    throw error;
  }
};

export const generateStatisticsPDF = async (defects, projectTitle = 'All Projects') => {
  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB');
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    // Calculate statistics
    const serviceTypeStats = {};
    const categoryStats = {};
    
    defects.forEach(defect => {
      // Service type count
      if (!serviceTypeStats[defect.serviceType]) {
        serviceTypeStats[defect.serviceType] = {
          count: 0,
          categories: {}
        };
      }
      serviceTypeStats[defect.serviceType].count++;
      
      // Category count per service type
      if (!serviceTypeStats[defect.serviceType].categories[defect.category]) {
        serviceTypeStats[defect.serviceType].categories[defect.category] = 0;
      }
      serviceTypeStats[defect.serviceType].categories[defect.category]++;
    });
    
    const serviceTypeSummaryRows = Object.keys(serviceTypeStats)
      .sort()
      .map(type => `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: 600;">${type}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${SERVICE_TYPE_NAMES[type]}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #1976d2; font-size: 14px;">${serviceTypeStats[type].count}</td>
        </tr>
      `).join('');
    
    const detailedStatsHtml = Object.keys(serviceTypeStats)
      .sort()
      .map(type => {
        const categories = serviceTypeStats[type].categories;
        const categoryRows = Object.keys(categories)
          .sort((a, b) => categories[b] - categories[a])
          .map((category, idx) => `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">
                <span style="display: inline-block; width: 25px; text-align: center; font-weight: bold; color: #999;">${idx + 1}.</span>
                ${category}
              </td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #1976d2; font-size: 13px;">${categories[category]}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                <div style="background-color: #e3f2fd; height: 20px; border-radius: 3px; position: relative;">
                  <div style="background: linear-gradient(90deg, #1976d2, #42a5f5); height: 100%; width: ${(categories[category] / serviceTypeStats[type].count * 100).toFixed(1)}%; border-radius: 3px;"></div>
                  <span style="position: absolute; top: 2px; right: 5px; font-size: 10px; font-weight: 600; color: #333;">
                    ${(categories[category] / serviceTypeStats[type].count * 100).toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>
          `).join('');
        
        return `
          <div style="margin-top: 30px; page-break-inside: avoid;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 15px; border-radius: 6px; margin-bottom: 10px;">
              <h3 style="margin: 0; font-size: 16px; font-weight: 700;">
                ${type} - ${SERVICE_TYPE_NAMES[type]}
                <span style="float: right; background-color: rgba(255,255,255,0.3); padding: 4px 12px; border-radius: 4px; font-size: 14px;">
                  ${serviceTypeStats[type].count} defects
                </span>
              </h3>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; background-color: white;">
              <thead>
                <tr>
                  <th style="background-color: #f5f5f5; color: #333; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: 700;">Category</th>
                  <th style="background-color: #f5f5f5; color: #333; padding: 10px; text-align: center; border: 1px solid #ddd; width: 15%; font-weight: 700;">Count</th>
                  <th style="background-color: #f5f5f5; color: #333; padding: 10px; text-align: center; border: 1px solid #ddd; width: 30%; font-weight: 700;">Distribution</th>
                </tr>
              </thead>
              <tbody>
                ${categoryRows}
              </tbody>
            </table>
          </div>
        `;
      }).join('');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 15mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              font-size: 11px;
              color: #333;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: 700;
            }
            .subtitle {
              font-size: 14px;
              opacity: 0.95;
            }
            .info-box {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 20px;
              border-left: 4px solid #667eea;
            }
            .total-box {
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
              padding: 30px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
              border: 2px solid #1976d2;
            }
            .total-box p {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #666;
              font-weight: 600;
            }
            .total-box h2 {
              margin: 0;
              color: #1976d2;
              font-size: 48px;
              font-weight: 700;
            }
            h2 {
              color: #2e7d32;
              margin: 0 0 15px 0;
              font-size: 18px;
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background-color: #f5f5f5;
              color: #333;
              padding: 12px 10px;
              text-align: left;
              border: 1px solid #ddd;
              font-weight: 700;
            }
            td {
              padding: 10px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #fafafa;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #999;
              border-top: 2px solid #e0e0e0;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Building Services Inspection Report</h1>
            <div class="subtitle">Statistical Analysis</div>
          </div>
          
          <div class="info-box">
            <div style="margin-bottom: 8px;">
              <strong style="color: #555;">Project:</strong> <span style="color: #333; font-weight: 600;">${projectTitle}</span>
            </div>
            <div>
              <strong style="color: #555;">Generated:</strong> <span style="color: #333;">${dateStr} at ${timeStr}</span>
            </div>
          </div>
          
          <div class="total-box">
            <p>Total Defects Recorded</p>
            <h2>${defects.length}</h2>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #333;">Summary by Service Type</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%; text-align: center;">Type</th>
                  <th style="width: 60%;">Description</th>
                  <th style="width: 25%; text-align: center;">Count</th>
                </tr>
              </thead>
              <tbody>
                ${serviceTypeSummaryRows}
              </tbody>
            </table>
          </div>
          
          <h2 style="margin: 25px 0 15px 0; color: #333; font-size: 20px;">Detailed Statistics by Category</h2>
          ${detailedStatsHtml}
          
          <div class="footer">
            <p><strong>Building Services Inspection App</strong></p>
            <p>Generated on ${dateStr} at ${timeStr}</p>
            <p>This report analyzes ${defects.length} defect record(s)</p>
          </div>
        </body>
      </html>
    `;
    
    const { uri } = await Print.printToFileAsync({ html });
    const fileName = `Statistics_${projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    const newPath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.moveAsync({
      from: uri,
      to: newPath,
    });
    
    return newPath;
  } catch (error) {
    console.error('Error generating statistics PDF:', error);
    throw error;
  }
};

export const sharePDF = async (pdfPath) => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(pdfPath);
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
};
