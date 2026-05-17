import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  getAllCourses,
  toggleCoursePublish,
  getAllCourseFeedback,
  getAllCertificates,
  updateCertificate,
  deleteCertificate,
  getAllMentors,
  updateMentorProfile,
} from '../controllers/admin.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorizeRoles('administrator'));

// ─── Mentor management ────────────────────────────────────────
router.get('/mentors', getAllMentors);
router.patch(
  '/mentors/:user_id',
  [
    param('user_id').isNumeric().withMessage('Invalid user ID'),
    body('specialization')
      .trim()
      .notEmpty().withMessage('Specialization is required')
      .isLength({ min: 2, max: 100 }).withMessage('Specialization must be 2-100 characters'),
    body('qualifications')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Qualifications must be max 500 characters'),
  ],
  validate,
  updateMentorProfile
);

// ─── User management ──────────────────────────────────────────
router.get('/users', getAllUsers);
router.patch('/users/:user_id/role', updateUserRole);

// ─── Course management ────────────────────────────────────────
router.get('/courses', getAllCourses);
router.patch('/courses/:course_id/publish', toggleCoursePublish);

// ─── Feedback management ──────────────────────────────────────
router.get('/feedback', getAllCourseFeedback);

// ─── Certificate management ───────────────────────────────────
router.get('/certificates', getAllCertificates);
router.patch('/certificates/:certificate_id', updateCertificate);
router.delete('/certificates/:certificate_id', deleteCertificate);

export default router;