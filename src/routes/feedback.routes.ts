import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createFeedbackController,
  getFeedbackController,
  updateFeedbackController,
  deleteFeedbackController,
  listFeedbackByCourseController,
} from '../controllers/feedback.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// ── POST /api/feedback/enrollments/:enrollment_id ───────
router.post(
  '/enrollments/:enrollment_id',
  authenticate,
  [
    param('enrollment_id').isInt({ min: 1 }).withMessage('Invalid enrollment ID'),
    body('rating')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comments')
      .optional()
      .isLength({ max: 1000 }).withMessage('Comments cannot exceed 1000 characters'),
  ],
  validate,
  createFeedbackController
);

// ── GET /api/feedback/enrollments/:enrollment_id ────────
router.get(
  '/enrollments/:enrollment_id',
  authenticate,
  [param('enrollment_id').isInt({ min: 1 }).withMessage('Invalid enrollment ID')],
  validate,
  getFeedbackController
);

// ── PUT /api/feedback/:feedback_id ─────────────────────
router.put(
  '/:feedback_id',
  authenticate,
  [
    param('feedback_id').isInt({ min: 1 }).withMessage('Invalid feedback ID'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comments')
      .optional()
      .isLength({ max: 1000 }).withMessage('Comments cannot exceed 1000 characters'),
  ],
  validate,
  updateFeedbackController
);

// ── DELETE /api/feedback/:feedback_id ──────────────────
router.delete(
  '/:feedback_id',
  authenticate,
  [param('feedback_id').isInt({ min: 1 }).withMessage('Invalid feedback ID')],
  validate,
  deleteFeedbackController
);

// ── GET /api/feedback/courses/:course_id ──────────────
router.get(
  '/courses/:course_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [param('course_id').isInt({ min: 1 }).withMessage('Invalid course ID')],
  validate,
  listFeedbackByCourseController
);

export default router;