
import { Router }      from 'express';
import { body, param } from 'express-validator';
import {
  issueCertificateController,
  getCertificateController,
  listMyCertificatesController,
  updateCertificateUrlController,
  deleteCertificateController,
  downloadCertificateController,
} from '../controllers/certificate.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// ── GET /api/certificates/my ──────────────────────────────────
// Must be BEFORE /:certificate_id to avoid route conflict
router.get(
  '/my',
  authenticate,
  listMyCertificatesController
);

// ── POST /api/certificates/issue ─────────────────────────────
// Learner triggers their own certificate for a completed course
// Body: { "course_id": 6 }
// user_id comes from JWT token — not from URL
router.post(
  '/issue',
  authenticate,
  [
    body('course_id')
      .notEmpty().withMessage('course_id is required')
      .isInt({ min: 1 }).withMessage('Invalid course_id'),
  ],
  validate,
  issueCertificateController
);

// ── GET /api/certificates/:certificate_id/download ───────────
// Must be BEFORE /:certificate_id to avoid conflict
router.get(
  '/:certificate_id/download',
  authenticate,
  [param('certificate_id').isInt({ min: 1 }).withMessage('Invalid certificate ID')],
  validate,
  downloadCertificateController
);

// ── GET /api/certificates/:certificate_id ────────────────────
router.get(
  '/:certificate_id',
  authenticate,
  [param('certificate_id').isInt({ min: 1 }).withMessage('Invalid certificate ID')],
  validate,
  getCertificateController
);

// ── PUT /api/certificates/:certificate_id/url ────────────────
// Admin only — manually update a certificate URL
router.put(
  '/:certificate_id/url',
  authenticate,
  authorizeRoles('administrator'),
  [
    param('certificate_id').isInt({ min: 1 }).withMessage('Invalid certificate ID'),
    body('certificate_url').isURL().withMessage('Invalid URL'),
  ],
  validate,
  updateCertificateUrlController
);

// ── DELETE /api/certificates/:certificate_id ─────────────────
// Admin only
router.delete(
  '/:certificate_id',
  authenticate,
  authorizeRoles('administrator'),
  [param('certificate_id').isInt({ min: 1 }).withMessage('Invalid certificate ID')],
  validate,
  deleteCertificateController
);

export default router;