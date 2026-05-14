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
} from '../controllers/admin.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorizeRoles('administrator'));

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