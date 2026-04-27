import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createCourseController,
  listCoursesController,
  getCourseController,
  updateCourseController,
  publishCourseController,
  deleteCourseController,
} from '../controllers/course.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// ── GET /api/courses ───────────
router.get('/', listCoursesController);

// ── GET /api/courses/:course_id ─────────
router.get(
  '/:course_id',
  [param('course_id').isInt({ min: 1 }).withMessage('Invalid course ID')],
  validate,
  getCourseController
);

// ── POST /api/courses ──────────────
router.post(
  '/',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required'),
    body('duration_mins')
      .optional()
      .isInt({ min: 0 }).withMessage('Duration must be a positive number'),
  ],
  validate,
  createCourseController
);

// ── PATCH /api/courses/:course_id ────────
router.patch(
  '/:course_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [
    param('course_id').isInt({ min: 1 }).withMessage('Invalid course ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim(),
    body('duration_mins')
      .optional()
      .isInt({ min: 0 }).withMessage('Duration must be a positive number'),
  ],
  validate,
  updateCourseController
);

// ── PATCH /api/courses/:course_id/publish ──────
router.patch(
  '/:course_id/publish',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [
    param('course_id').isInt({ min: 1 }).withMessage('Invalid course ID'),
    body('is_published')
      .isBoolean().withMessage('is_published must be true or false'),
  ],
  validate,
  publishCourseController
);

// ── DELETE /api/courses/:course_id ──────────
router.delete(
  '/:course_id',
  authenticate,
  authorizeRoles('administrator'),
  [param('course_id').isInt({ min: 1 }).withMessage('Invalid course ID')],
  validate,
  deleteCourseController
);

export default router;