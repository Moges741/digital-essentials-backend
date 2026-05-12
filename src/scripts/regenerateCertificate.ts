
import db                 from '../config/db';
import { generateCertificateService } from '../services/certificate.service';

const run = async () => {
  console.log('Testing certificate generation...');

  // Find a completed enrollment
  const completedEnrollment = await db('enrollments')
    .where('status', 'completed')
    .first();

  if (!completedEnrollment) {
    console.log('No completed enrollments found');
    return;
  }

  console.log(`Found completed enrollment: ${completedEnrollment.enrollment_id} for user ${completedEnrollment.user_id}, course ${completedEnrollment.course_id}`);

  // Check if certificate already exists
  const existingCert = await db('certificates')
    .where({
      user_id: completedEnrollment.user_id,
      course_id: completedEnrollment.course_id
    })
    .first();

  if (existingCert) {
    console.log('Certificate already exists');
    return;
  }

  console.log('Generating certificate...');
  try {
    await generateCertificateService(completedEnrollment.user_id, completedEnrollment.course_id);
    console.log('Certificate generated successfully!');
  } catch (error) {
    console.error('Certificate generation failed:', error);
  }
};

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});