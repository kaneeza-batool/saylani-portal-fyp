// One-off script: renders knowledgeBaseContent.js's SECTIONS into a human-
// readable PDF (the actual knowledge document TITAN staff can review/edit
// the source of, and prospective/current users can browse directly). Run:
//   node scripts/generateKnowledgeBasePdf.js
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { SECTIONS } = require('./knowledgeBaseContent');

const OUT_PATH = path.join(__dirname, '..', '..', 'TITAN-Knowledge-Base.pdf');

const doc = new PDFDocument({ margin: 56, size: 'A4' });
doc.pipe(fs.createWriteStream(OUT_PATH));

doc.fontSize(24).fillColor('#132345').font('Helvetica-Bold').text('TITAN Knowledge Base', { align: 'center' });
doc.moveDown(0.3);
doc
  .fontSize(11)
  .fillColor('#667085')
  .font('Helvetica')
  .text('Taj Institute of Technology & Applied Networks', { align: 'center' });
doc.moveDown(2);

SECTIONS.forEach((section, i) => {
  if (i > 0) doc.moveDown(1.2);
  doc.fontSize(15).fillColor('#132345').font('Helvetica-Bold').text(section.title);
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor('#202938').font('Helvetica').text(section.body, { align: 'left', lineGap: 3 });
});

doc.end();

doc.on('end', () => {
  console.log('Knowledge base PDF written to', OUT_PATH);
});
