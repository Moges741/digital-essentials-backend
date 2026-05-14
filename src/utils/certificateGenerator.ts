
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

    const W = 841.89;
    const H = 595.28;

    const navy = '#0D2244';
    const gold = '#C9A04C';
    const ink = '#132A4A';
    const soft = '#FAF8F2';
    const line = '#D9C48A';

    // Background and outer frame
    doc.rect(0, 0, W, H).fill(navy);
    doc.rect(18, 18, W - 36, H - 36).fill(soft);
    doc.rect(28, 28, W - 56, H - 56).lineWidth(2.2).stroke(gold);
    doc.rect(34, 34, W - 68, H - 68).lineWidth(0.8).stroke(line);

    // Rectangular header band
    doc.rect(42, 42, W - 84, 82).fill(navy);
    doc.rect(52, 52, W - 104, 62).lineWidth(1.3).stroke(gold);

    doc.font('Helvetica-Bold')
      .fontSize(26)
      .fillColor('#FFFFFF')
      .text('Digital Essentials Platform', 60, 63, {
        align: 'center',
        width: W - 120,
      });

    doc.font('Helvetica')
      .fontSize(11)
      .fillColor('#F2D999')
      .text('Certificate of Completion', 60, 92, {
        align: 'center',
        width: W - 120,
        characterSpacing: 2.4,
      });

    // Main certificate panel (single rectangular panel)
    doc.rect(70, 142, W - 140, 315).fill('#FFFFFF');
    doc.rect(76, 148, W - 152, 303).lineWidth(1.4).stroke(gold);

    // Thin side accents only
    doc.rect(86, 164, 2, 271).fill(gold);
    doc.rect(W - 88, 164, 2, 271).fill(gold);

    // Required heading blocks
    doc.font('Helvetica')
      .fontSize(12)
      .fillColor('#5A6474')
      .text('This certificate is proudly presented to', 0, 176, {
        align: 'center',
        width: W,
      });

    doc.font('Times-Italic')
      .fontSize(34)
      .fillColor(ink)
      .text(data.learnerName, 185, 205, {
        align: 'center',
        width: W - 370,
      });

    doc.moveTo(210, 246)
      .lineTo(W - 210, 246)
      .lineWidth(0.8)
      .stroke(line);

    doc.font('Helvetica')
      .fontSize(12)
      .fillColor('#5A6474')
      .text('for successfully completing the course', 0, 264, {
        align: 'center',
        width: W,
      });

    doc.font('Helvetica-Bold')
      .fontSize(22)
      .fillColor(ink)
      .text(data.courseName, 142, 298, {
        align: 'center',
        width: W - 284,
      });

    doc.moveTo(170, 333)
      .lineTo(W - 170, 333)
      .lineWidth(0.8)
      .stroke(line);

    doc.font('Helvetica')
      .fontSize(11.5)
      .fillColor('#5A6474')
      .text('through the Digital Essentials Platform with dedication and outstanding achievement.', 110, 352, {
        align: 'center',
        width: W - 220,
      });

    // Sponsors (no extra rectangle around text)
    doc.moveTo(250, 389).lineTo(W - 250, 389).lineWidth(0.8).stroke(line);
    doc.font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(gold)
      .text('Sponsored by', 0, 397, { align: 'center', width: W });
    doc.font('Helvetica-Bold')
      .fontSize(12.5)
      .fillColor(ink)
      .text('Jimma Institute of Technology', 0, 410, { align: 'center', width: W });
    doc.font('Helvetica-Bold')
      .fontSize(11.5)
      .fillColor(ink)
      .text('TCBTP Team', 0, 425, { align: 'center', width: W });

    // Footer (clean section with only guide lines)
    doc.moveTo(70, 468).lineTo(W - 70, 468).lineWidth(1).stroke(gold);
    doc.moveTo(285, 474).lineTo(285, 542).lineWidth(0.8).stroke(line);
    doc.moveTo(556, 474).lineTo(556, 542).lineWidth(0.8).stroke(line);

    // Left footer sign block
    doc.font('Helvetica')
      .fontSize(9.5)
      .fillColor('#5A6474')
      .text('Instructor', 86, 480, { width: 180, align: 'center' });
    doc.moveTo(95, 503).lineTo(255, 503).lineWidth(0.8).stroke('#70839C');

    // Center footer issue block
    doc.font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(ink)
      .text(`Date of Issue: ${data.issuedDate}`, 300, 482, {
        width: 240,
        align: 'center',
      });
    doc.font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(ink)
      .text(`Certificate ID: #${String(data.certificateId).padStart(6, '0')}`, 300, 502, {
        width: 240,
        align: 'center',
      });

    // Right footer sign block
    doc.font('Helvetica')
      .fontSize(9.5)
      .fillColor('#5A6474')
      .text('Platform Director', 576, 480, { width: 180, align: 'center' });
    doc.moveTo(585, 503).lineTo(745, 503).lineWidth(0.8).stroke('#70839C');

    // Bottom band to close rectangular composition
    doc.rect(42, 548, W - 84, 14).fill(navy);
    doc.rect(52, 551, W - 104, 8).fill(gold);

    doc.end();
  });
};