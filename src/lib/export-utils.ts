import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1",
) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportToPDF(options: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  totalRecords: number;
  filename: string;
}) {
  const { title, subtitle, headers, rows, totalRecords, filename } = options;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 40;
  const usableWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Title
  page.drawText(title, {
    x: margin,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 28;

  // Subtitle / date
  const dateStr = `Generated: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`;
  page.drawText(dateStr, {
    x: margin,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 16;

  if (subtitle) {
    page.drawText(subtitle, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 20;
  } else {
    y -= 6;
  }

  // Table
  const colCount = headers.length;
  const colWidth = usableWidth / colCount;
  const rowHeight = 18;
  const headerHeight = 22;
  const fontSize = 8;

  const drawTableHeader = (p: ReturnType<typeof doc.addPage>, yPos: number) => {
    // Header background
    p.drawRectangle({
      x: margin,
      y: yPos - headerHeight + 4,
      width: usableWidth,
      height: headerHeight,
      color: rgb(0.06, 0.09, 0.16),
    });

    headers.forEach((h, i) => {
      p.drawText(h, {
        x: margin + i * colWidth + 6,
        y: yPos - 10,
        size: fontSize,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
    });

    return yPos - headerHeight;
  };

  y = drawTableHeader(page, y);

  // Rows
  rows.forEach((row, rowIndex) => {
    if (y - rowHeight < margin + 20) {
      // Footer on current page
      page.drawText(`Total records: ${totalRecords}`, {
        x: margin,
        y: margin,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      y = drawTableHeader(page, y);
    }

    // Alternating row background
    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight + 6,
        width: usableWidth,
        height: rowHeight,
        color: rgb(0.96, 0.96, 0.96),
      });
    }

    row.forEach((cell, i) => {
      const text = String(cell);
      const maxChars = Math.floor(colWidth / 4.5);
      const truncated = text.length > maxChars ? text.slice(0, maxChars - 1) + "\u2026" : text;
      page.drawText(truncated, {
        x: margin + i * colWidth + 6,
        y: y - 10,
        size: fontSize,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
    });

    y -= rowHeight;
  });

  // Footer
  page.drawText(`Total records: ${totalRecords}`, {
    x: margin,
    y: margin,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
