import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const EXCEL_FILE = path.join(process.cwd(), 'rankings.xlsx');

interface ExcelData {
  projectName: string;
  websiteUrl: string;
  keyword: string;
  foundUrl: string;
  rank: string; 
  date: string; 
}

export const updateExcelMatrix = async (data: ExcelData[]) => {
  const workbook = new ExcelJS.Workbook();
  
  if (fs.existsSync(EXCEL_FILE)) {
    await workbook.xlsx.readFile(EXCEL_FILE);
  }

  for (const item of data) {
    const sheetName = item.projectName.substring(0, 31).replace(/[\[\]\:\*\?\/\\]/g, '_');
    let worksheet = workbook.getWorksheet(sheetName);
    
    if (!worksheet) {
      worksheet = workbook.addWorksheet(sheetName);
      const headerRow = worksheet.getRow(1);
      headerRow.values = ["Keyword", "Detected URL", "Rank", "Date"];
      headerRow.font = { bold: true };
      
      // Fixed widths
      worksheet.getColumn(1).width = 30;
      worksheet.getColumn(2).width = 50;
      worksheet.getColumn(3).width = 15;
      worksheet.getColumn(4).width = 15;
    }

    // Since we now want a log-style "Keyword | URL | Rank | Date"
    // We add a new row at the bottom for the latest scan
    worksheet.addRow([
      item.keyword,
      item.foundUrl,
      item.rank,
      item.date
    ]);
  }

  await workbook.xlsx.writeFile(EXCEL_FILE);
  console.log(`Excel Log updated: ${EXCEL_FILE}`);
};
