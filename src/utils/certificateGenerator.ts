
import PDFDocument from 'pdfkit';

interface CertificateData {
  learnerName:  string;
  courseName:   string;
  issuedDate:   string;
  certificateId: number;
}

export const generateCertificatePDF = (
  data: CertificateData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {

    // Create PDF in landscape orientation
    const doc = new PDFDocument({
      layout: 'landscape',
      size:   'A4',
      margin: 0,
    });

    const chunks: Buffer[] = [];

    doc.on('data',  (chunk) => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 841.89;  // A4 landscape width  (points)
    const H = 595.28;  // A4 landscape height (points)

    // ── Background ──────────────────────────────────────
    // Deep blue background
    doc.rect(0, 0, W, H).fill('#1E3A5F');

    // Lighter inner border area
    const margin = 30;
    doc.roundedRect(margin, margin, W - margin * 2, H - margin * 2, 8)
       .fill('#FFFFFF');

    // ── Decorative border lines ──────────────────────────
    doc.rect(margin + 8, margin + 8, W - (margin + 8) * 2, H - (margin + 8) * 2)
       .lineWidth(1.5)
       .stroke('#1E3A5F');

    // ── Top accent bar ───────────────────────────────────
    doc.rect(margin + 8, margin + 8, W - (margin + 8) * 2, 6)
       .fill('#1E3A5F');

    // ── Bottom accent bar ────────────────────────────────
    doc.rect(margin + 8, H - margin - 14, W - (margin + 8) * 2, 6)
       .fill('#1E3A5F');

    // ── Company name ─────────────────────────────────────
    doc.font('Helvetica-Bold')
       .fontSize(13)
       .fillColor('#2563EB')
       .text('DIGITAL ESSENTIALS PLATFORM', 0, 62, {
         align: 'center',
         width: W,
       });

    // ── Subtitle ─────────────────────────────────────────
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#6B7280')
       .text('Jimma Institute of Technology · Bosa Addis Kebele, Jimma, Ethiopia', 0, 80, {
         align: 'center',
         width: W,
       });

    // ── Divider line ─────────────────────────────────────
    doc.moveTo(W * 0.25, 102)
       .lineTo(W * 0.75, 102)
       .lineWidth(0.5)
       .stroke('#D1D5DB');

    // ── "Certificate of Completion" label ────────────────
    doc.font('Helvetica')
       .fontSize(11)
       .fillColor('#9CA3AF')
       .text('CERTIFICATE OF COMPLETION', 0, 118, {
         align:          'center',
         width:          W,
         characterSpacing: 3,
       });

    // ── "This certifies that" ────────────────────────────
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#4B5563')
       .text('This certifies that', 0, 155, {
         align: 'center',
         width: W,
       });

    // ── Learner name ─────────────────────────────────────
    // The most prominent element on the certificate
    doc.font('Helvetica-Bold')
       .fontSize(38)
       .fillColor('#1E3A5F')
       .text(data.learnerName, 0, 175, {
         align: 'center',
         width: W,
       });

    // ── Underline under name ─────────────────────────────
    const nameWidth = doc.widthOfString(data.learnerName);
    const nameX     = (W - Math.min(nameWidth, W * 0.7)) / 2;
    doc.moveTo(nameX, 222)
       .lineTo(W - nameX, 222)
       .lineWidth(1)
       .stroke('#2563EB');

    // ── "has successfully completed" ─────────────────────
    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#4B5563')
       .text('has successfully completed the course', 0, 235, {
         align: 'center',
         width: W,
       });

    // ── Course name ───────────────────────────────────────
    doc.font('Helvetica-Bold')
       .fontSize(22)
       .fillColor('#1D4ED8')
       .text(data.courseName, 60, 260, {
         align: 'center',
         width: W - 120,
       });

    // ── Decorative stars ──────────────────────────────────
    const starY = 310;
    ['★', '★', '★'].forEach((star, i) => {
      doc.font('Helvetica')
         .fontSize(14)
         .fillColor('#F59E0B')
         .text(star, W / 2 - 30 + i * 20, starY, { width: 20, align: 'center' });
    });

    // ── Issue date and certificate ID ─────────────────────
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#6B7280')
       .text(`Issued on: ${data.issuedDate}`, W / 2 - 200, 345, {
         width: 200,
         align: 'right',
       });

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#6B7280')
       .text(`Certificate ID: #${String(data.certificateId).padStart(6, '0')}`, W / 2 + 10, 345, {
         width: 200,
         align: 'left',
       });

    // ── Bottom signature line ─────────────────────────────
    doc.moveTo(W * 0.3, 395)
       .lineTo(W * 0.7, 395)
       .lineWidth(0.5)
       .stroke('#9CA3AF');

    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#9CA3AF')
       .text('Digital Essentials Platform · CBTP Phase II', 0, 402, {
         align: 'center',
         width: W,
       });

    doc.end();
  });
};