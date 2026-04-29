// src/routes/lesson.routes.ts

import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createLessonController,
  listLessonsController,
  getLessonController,
  updateLessonController,
  deleteLessonController,
} from '../controllers/lesson.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

// mergeParams: true is CRITICAL here

const router = Router({ mergeParams: true });

// ── GET /api/courses/:course_id/lessons ───────────────────────

router.get('/', listLessonsController);

// ── GET /api/courses/:course_id/lessons/:lesson_id ────────────
router.get(
  '/:lesson_id',
  [param('lesson_id').isInt({ min: 1 }).withMessage('Invalid lesson ID')],
  validate,
  getLessonController
);

// ── POST /api/courses/:course_id/lessons ──────────────────────
router.post(
  '/',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('content')
      .optional()
      .trim(),
    body('lesson_order')
      .optional()
      .isInt({ min: 1 }).withMessage('lesson_order must be a positive integer'),
  ],
  validate,
  createLessonController
);

router.patch(
  '/:lesson_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [
    param('lesson_id').isInt({ min: 1 }).withMessage('Invalid lesson ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('content')
      .optional()
      .trim(),
    body('lesson_order')
      .optional()
      .isInt({ min: 1 }).withMessage('lesson_order must be a positive integer'),
  ],
  validate,
  updateLessonController
);

router.delete(
  '/:lesson_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [param('lesson_id').isInt({ min: 1 }).withMessage('Invalid lesson ID')],
  validate,
  deleteLessonController
);

export default router;