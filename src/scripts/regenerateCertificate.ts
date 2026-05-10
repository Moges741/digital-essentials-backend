
import db                 from '../config/db';
import { generateCertificateService } from '../services/certificate.service';

const run = async () => {
  console.log('Checking for certificates with empty URLs...');

  const empties = await db('certificates')
    .where('certificate_url', '')
    .orWhere('certificate_url', 'like', '%example.com%')
    .orWhere('certificate_url', 'like', '%digital-essentials.com%')
    .select('certificate_id', 'user_id', 'course_id');

  console.log(`Found ${empties.length} certificates to regenerate`);

  for (const cert of empties) {
    console.log(
      `Regenerating certificate ${cert.certificate_id} ` +
      `for user ${cert.user_id}, course ${cert.course_id}...`
    );

    // Delete old record so generateCertificateService creates a fresh one
    await db('certificates')
      .where('certificate_id', cert.certificate_id)
      .delete();

    await generateCertificateService(cert.user_id, cert.course_id);
    console.log('Done ✓');
  }

  console.log('All certificates regenerated.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});