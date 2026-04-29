import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  markCompleteController,
  syncProgressController,
  getCourseProgressController,
  getLearnerProgressController,
} from '../controllers/progress.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// ── PATCH /api/progress/:lesson_id/complete ─────────
router.patch(
  '/:lesson_id/complete',
  authenticate,
  authorizeRoles('learner'),
  [param('lesson_id').isInt({ min: 1 }).withMessage('Invalid lesson ID')],
  validate,
  markCompleteController
);

// ── POST /api/progress/sync ───────────────
router.post(
  '/sync',
  authenticate,
  authorizeRoles('learner'),
  [
    body('completions')
      .isArray({ min: 1 }).withMessage('completions must be a non-empty array'),
    body('completions.*.lesson_id')
      .isInt({ min: 1 }).withMessage('Each lesson_id must be a valid integer'),
    body('completions.*.completed_at')
      .isISO8601().withMessage('Each completed_at must be a valid ISO date'),
  ],
  validate,
  syncProgressController
);

// ── GET /api/progress/course/:course_id ───
router.get(
  '/course/:course_id',
  authenticate,
  [param('course_id').isInt({ min: 1 }).withMessage('Invalid course ID')],
  validate,
  getCourseProgressController
);

// ── GET /api/progress/course/:course_id/user/:user_id 
router.get(
  '/course/:course_id/user/:user_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [
    param('course_id').isInt({ min: 1 }).withMessage('Invalid course ID'),
    param('user_id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  ],
  validate,
  getLearnerProgressController
);

export default router;