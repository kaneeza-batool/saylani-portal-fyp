import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function timestamp() {
  return new Date().toISOString().slice(0, 10);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * @param {string} filenameBase
 * @param {{ header: string, accessor: (row: any) => any }[]} columns
 * @param {any[]} rows
 */
export function exportToCsv(filenameBase, columns, rows) {
  const lines = [
    columns.map((c) => csvCell(c.header)).join(','),
    ...rows.map((row) => columns.map((c) => csvCell(c.accessor(row))).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filenameBase}-${timestamp()}.csv`);
}

/**
 * @param {string} title
 * @param {string} filenameBase
 * @param {{ header: string, accessor: (row: any) => any }[]} columns
 * @param {any[]} rows
 */
export function exportToPdf(title, filenameBase, columns, rows) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.setTextColor(18, 35, 74);
  doc.text('TITAN — Taj Institute of Technology & Applied Networks', 14, 15);
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(title, 14, 22);
  doc.setFontSize(8.5);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 27);

  autoTable(doc, {
    startY: 32,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(c.accessor(row) ?? ''))),
    headStyles: { fillColor: [18, 35, 74], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 248, 246] },
    styles: { fontSize: 8.5, cellPadding: 3 },
  });

  doc.save(`${filenameBase}-${timestamp()}.pdf`);
}
