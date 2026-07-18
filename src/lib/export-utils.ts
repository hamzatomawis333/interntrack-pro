import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export function exportToPDF(options: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  totalRecords: number;
  filename: string;
}) {
  const { title, subtitle, headers, rows, totalRecords, filename } = options;
  const doc = new jsPDF("landscape", "mm", "a4");

  doc.setFontSize(18);
  doc.text(title, 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100);
  const dateLine = `Generated: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`;
  doc.text(dateLine, 14, 26);

  if (subtitle) {
    doc.text(subtitle, 14, 32);
  }

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: subtitle ? 38 : 32,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Total records: ${totalRecords}`, 14, pageHeight - 10);
    },
  });

  doc.save(`${filename}.pdf`);
}
