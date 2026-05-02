import db from '../config/db';
import { Certificate, CertificateWithDetails } from '../types/certificate.types';

// ─── Create certificate ───────────
export const createCertificate = async (data: {
  user_id:         number;
  course_id:       number;
  certificate_url: string | null;
}): Promise<number> => {
  const [certificate_id] = await db('certificates').insert({
    ...data,
    issued_at: new Date(),
  });
  return certificate_id;
};

// ─── Find certificate by user and course ─────────
export const findCertificateByUserAndCourse = async (
  user_id: number,
  course_id: number
): Promise<Certificate | undefined> => {
  return db('certificates')
    .where({ user_id, course_id })
    .first();
};

// ─── Find certificate by ID ─────────
export const findCertificateById = async (
  certificate_id: number
): Promise<CertificateWithDetails | undefined> => {
  return db('certificates')
    .join('users', 'certificates.user_id', 'users.user_id')
    .join('courses', 'certificates.course_id', 'courses.course_id')
    .where('certificates.certificate_id', certificate_id)
    .select(
      'certificates.*',
      'courses.title as course_title',
      'users.name as user_name',
      'users.email as user_email'
    )
    .first();
};

// ─── List certificates by user ─────────
export const listCertificatesByUser = async (
  user_id: number
): Promise<CertificateWithDetails[]> => {
  return db('certificates')
    .join('courses', 'certificates.course_id', 'courses.course_id')
    .where('certificates.user_id', user_id)
    .select(
      'certificates.*',
      'courses.title as course_title'
    )
    .orderBy('certificates.issued_at', 'desc');
};

// ─── Update certificate URL ───────────
export const updateCertificateUrl = async (
  certificate_id: number,
  certificate_url: string
): Promise<void> => {
  await db('certificates')
    .where({ certificate_id })
    .update({ certificate_url });
};

// ─── Delete certificate ───────────
export const deleteCertificate = async (certificate_id: number): Promise<void> => {
  await db('certificates')
    .where({ certificate_id })
    .delete();
};