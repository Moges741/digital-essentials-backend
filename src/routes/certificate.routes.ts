import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  issueCertificateController,
  getCertificateController,
  listMyCertificatesController,
  updateCertificateUrlController,
  deleteCertificateController,
} from '../controllers/certificate.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// ── POST /api/certificates/issue/:user_id/:course_id ───
router.post(
  '/issue/:user_id/:course_id',
  authenticate,
  [
    param('user_id').isInt({ min: 1 }).withMessage('Invalid user ID'),
    param('course_id').isInt({ min: 1 }).withMessage('Invalid course ID'),
  ],
  validate,
  issueCertificateController
);

// ── GET /api/certificates/my ──────────────────────────
router.get(
  '/my',
  authenticate,
  listMyCertificatesController
);

// ── GET /api/certificates/:certificate_id ────────────
router.get(
  '/:certificate_id',
  authenticate,
  [param('certificate_id').isInt({ min: 1 }).withMessage('Invalid certificate ID')],
  validate,
  getCertificateController
);

// ── PUT /api/certificates/:certificate_id/url ────────
router.put(
  '/:certificate_id/url',
  authenticate,
  authorizeRoles('administrator'),
  [
    param('certificate_id').isInt({ min: 1 }).withMessage('Invalid certificate ID'),
    body('certificate_url')
      .isURL().withMessage('Invalid URL'),
  ],
  validate,
  updateCertificateUrlController
);

// ── DELETE /api/certificates/:certificate_id ─────────
router.delete(
  '/:certificate_id',
  authenticate,
  authorizeRoles('administrator'),
  [param('certificate_id').isInt({ min: 1 }).withMessage('Invalid certificate ID')],
  validate,
  deleteCertificateController
);

export default router;