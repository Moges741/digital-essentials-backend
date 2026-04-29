// src/routes/enrollment.routes.ts

import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  enrollController,
  getMyEnrollmentsController,
  getCourseEnrollmentsController,
  dropEnrollmentController,
} from '../controllers/enrollment.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// ── POST /api/enrollments ─────────────────────────────────────
// Learner only — enroll in a course
router.post(
  '/',
  authenticate,
  authorizeRoles('learner'),
  [
    body('course_id')
      .notEmpty().withMessage('course_id is required')
      .isInt({ min: 1 }).withMessage('Invalid course_id'),
  ],
  validate,
  enrollController
);

// ── GET /api/enrollments/my ───────────────────────────────────
router.get(
  '/my',
  authenticate,
  getMyEnrollmentsController
);

// ── GET /api/enrollments/course/:course_id ────────────────────
// Mentor and admin — see who enrolled in a course
router.get(
  '/course/:course_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [param('course_id').isInt({ min: 1 }).withMessage('Invalid course ID')],
  validate,
  getCourseEnrollmentsController
);

// ── PATCH /api/enrollments/:enrollment_id/drop ────────────────
router.patch(
  '/:enrollment_id/drop',
  authenticate,
  [param('enrollment_id').isInt({ min: 1 }).withMessage('Invalid enrollment ID')],
  validate,
  dropEnrollmentController
);

export default router;