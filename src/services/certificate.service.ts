import cloudinary from '../config/cloudinary';
import {
  createCertificate,
  findCertificateByUserAndCourse,
  findCertificateById,
  listCertificatesByUser,
  updateCertificateUrl,
  deleteCertificate,
} from '../models/certificate.model';
import { Readable }   from 'stream';
import { generateCertificatePDF } from '../utils/certificateGenerator';
import { findUserById } from '../models/user.model';
import { format }     from 'date-fns';
import { findCourseById } from '../models/course.model';
import { findEnrollmentByUserAndCourse } from '../models/enrollment.model';
import {
  Certificate,
  CertificateWithDetails,
} from '../types/certificate.types';
import { JwtPayload } from '../types/auth.types';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../utils/errors';

// ─── Helper: check if course is completed ───────
const isCourseCompleted = async (
  user_id: number,
  course_id: number
): Promise<boolean> => {
  const enrollment = await findEnrollmentByUserAndCourse(user_id, course_id);
  return enrollment ? enrollment.status === 'completed' : false;
};

// ─── ISSUE CERTIFICATE ───────────
export const issueCertificateService = async (
  user_id: number,
  course_id: number,
  user: JwtPayload
): Promise<Certificate> => {
  // Only admin or the user themselves can issue
  const isAdmin = user.role === 'administrator';
  if (!isAdmin && user.user_id !== user_id) {
    throw new ForbiddenError('You can only issue certificates for yourself');
  }

  const course = await findCourseById(course_id);
  if (!course) throw new NotFoundError('Course not found');

  // Check if already issued
  const existing = await findCertificateByUserAndCourse(user_id, course_id);
  if (existing) {
    throw new ConflictError('Certificate already issued for this course');
  }

  // Check if course completed
  const completed = await isCourseCompleted(user_id, course_id);
  if (!completed) {
    throw new ForbiddenError('Course not completed yet');
  }

  // Generate certificate URL (placeholder, you might use a PDF generator)
  const certificate_url = `https://example.com/certificates/${user_id}-${course_id}.pdf`; // Placeholder

  const certificate_id = await createCertificate({
    user_id,
    course_id,
    certificate_url,
  });

  const certificate = await findCertificateByUserAndCourse(user_id, course_id);
  return certificate!;
};

// ─── GET CERTIFICATE ────────────────
export const getCertificateService = async (
  certificate_id: number,
  user: JwtPayload
): Promise<CertificateWithDetails> => {
  const certificate = await findCertificateById(certificate_id);
  if (!certificate) throw new NotFoundError('Certificate not found');

  const isOwner = certificate.user_id === user.user_id;
  const isAdmin = user.role === 'administrator';
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('You can only view your own certificates');
  }

  return certificate;
};

// ─── LIST MY CERTIFICATES ──────────────────────────────
export const listMyCertificatesService = async (
  user: JwtPayload
): Promise<CertificateWithDetails[]> => {
  return listCertificatesByUser(user.user_id);
};

// ─── UPDATE CERTIFICATE URL ───────────────────
export const updateCertificateUrlService = async (
  certificate_id: number,
  certificate_url: string,
  user: JwtPayload
): Promise<void> => {
  const certificate = await findCertificateById(certificate_id);
  if (!certificate) throw new NotFoundError('Certificate not found');

  const isAdmin = user.role === 'administrator';
  if (!isAdmin) {
    throw new ForbiddenError('Only administrators can update certificate URLs');
  }

  await updateCertificateUrl(certificate_id, certificate_url);
};

// ─── DELETE CERTIFICATE ──────────────────────
export const deleteCertificateService = async (
  certificate_id: number,
  user: JwtPayload
): Promise<void> => {
  const certificate = await findCertificateById(certificate_id);
  if (!certificate) throw new NotFoundError('Certificate not found');

  const isAdmin = user.role === 'administrator';
  if (!isAdmin) {
    throw new ForbiddenError('Only administrators can delete certificates');
  }

  await deleteCertificate(certificate_id);
};
// ── AUTO GENERATE REAL PDF CERTIFICATE ────────────────────────
// Called from progress.service.ts when all lessons complete
// Generates real PDF → uploads to Cloudinary → stores URL in DB
export const generateCertificateService = async (
  user_id:   number,
  course_id: number
): Promise<void> => {

  // Don't generate if certificate already exists
  const existing = await findCertificateByUserAndCourse(
    user_id,
    course_id
  );
  if (existing) return;

  // Get course details for the certificate text
  const course = await findCourseById(course_id);
  if (!course) return;

  // Get learner name for the certificate
  const user = await findUserById(user_id);
  if (!user) return;

  // Create the certificate record first to get certificate_id
  const certificate_id = await createCertificate({
    user_id,
    course_id,
    certificate_url: '',  // placeholder — updated below
  });

  try {
    // Generate PDF buffer
    const pdfBuffer = await generateCertificatePDF({
      learnerName:    user.name,
      courseName:     course.title,
      issuedDate:     format(new Date(), 'MMMM dd, yyyy'),
      certificateId:  certificate_id,
    });

    // Upload PDF to Cloudinary
    const cloudinaryUrl = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder:        'digital-essentials/certificates',
          public_id:     `certificate_${user_id}_${course_id}`,
          resource_type: 'raw',
          format:        'pdf',
          // Allow download with original filename
          use_filename:  true,
          unique_filename: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result.secure_url);
        }
      );

      // Pipe buffer to upload stream
      const readable = new Readable();
      readable.push(pdfBuffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });

    // Update certificate record with real Cloudinary URL
    await updateCertificateUrl(certificate_id, cloudinaryUrl);

  } catch (error) {
    // If PDF generation fails, certificate record still exists
    // with empty URL — better than no record at all
    console.error('Certificate PDF generation failed:', error);
  }
};