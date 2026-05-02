import { Router }      from 'express';
import { body, param } from 'express-validator';
import {
  createExerciseController,
  listExercisesController,
  getExerciseController,
  deleteExerciseController,
  submitExerciseController,
  getSubmissionsController,
  getMySubmissionsController,
} from '../controllers/exercise.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate }    from '../middleware/validate.middleware';
import { upload }      from '../config/multer';

const router = Router({ mergeParams: true });

// ── GET /api/courses/:course_id/exercises ─────────────────────
router.get(
  '/',
  authenticate,
  listExercisesController
);

// ── GET /api/courses/:course_id/exercises/my-submissions ──────
router.get(
  '/my-submissions',
  authenticate,
  authorizeRoles('learner'),
  getMySubmissionsController
);

// ── GET /api/courses/:course_id/exercises/:exercise_id ────────
router.get(
  '/:exercise_id',
  authenticate,
  [param('exercise_id').isInt({ min: 1 }).withMessage('Invalid exercise ID')],
  validate,
  getExerciseController
);

// ── POST /api/courses/:course_id/exercises ────────────────────
router.post(
  '/',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  upload.single('file'),
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('content_type')
      .notEmpty().withMessage('content_type is required')
      .isIn(['quiz', 'worksheet', 'simulation'])
      .withMessage('content_type must be quiz, worksheet or simulation'),
    body('lesson_id')
      .notEmpty().withMessage('lesson_id is required')
      .isInt({ min: 1 }).withMessage('lesson_id must be a valid integer'),
    body('is_downloadable')
      .optional()
      .isIn(['true', 'false']).withMessage('is_downloadable must be true or false'),
  ],
  validate,
  createExerciseController
);

// ── POST /api/courses/:course_id/exercises/:exercise_id/submit
router.post(
  '/:exercise_id/submit',
  authenticate,
  authorizeRoles('learner'),
  [
    param('exercise_id').isInt({ min: 1 }).withMessage('Invalid exercise ID'),
    body('score')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  ],
  validate,
  submitExerciseController
);

// ── GET /api/courses/:course_id/exercises/:exercise_id/submissions
router.get(
  '/:exercise_id/submissions',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [param('exercise_id').isInt({ min: 1 }).withMessage('Invalid exercise ID')],
  validate,
  getSubmissionsController
);

// ── DELETE /api/courses/:course_id/exercises/:exercise_id ─────
router.delete(
  '/:exercise_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [param('exercise_id').isInt({ min: 1 }).withMessage('Invalid exercise ID')],
  validate,
  deleteExerciseController
);

export default router;