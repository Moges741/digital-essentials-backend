
import { Router }      from 'express';
import { body, param } from 'express-validator';
import {
  createExamController,
  getExamController,
  updateExamController,
  deleteExamController,
  addQuestionController,
  updateQuestionController,
  deleteQuestionController,
  submitExamController,
  getExamResultController,
  getSubmissionsController,
  gradeAnswerController,
} from '../controllers/exam.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router({ mergeParams: true });

// ── GET /api/courses/:course_id/exam ──────────────────────────
// Learner gets exam without answers, mentor gets full exam
router.get('/', authenticate, getExamController);

// ── POST /api/courses/:course_id/exam ─────────────────────────
router.post(
  '/',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('passing_score')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Passing score must be between 1 and 100'),
  ],
  validate,
  createExamController
);

// ── PATCH /api/courses/:course_id/exam ────────────────────────
router.patch(
  '/',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [
    body('passing_score')
      .isInt({ min: 1, max: 100 })
      .withMessage('Passing score must be between 1 and 100'),
  ],
  validate,
  updateExamController
);

// ── DELETE /api/courses/:course_id/exam ───────────────────────
router.delete(
  '/',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  deleteExamController
);

// ── POST /api/courses/:course_id/exam/questions ───────────────
router.post(
  '/questions',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [
    body('question_text')
      .trim().notEmpty().withMessage('Question text is required'),
    body('question_type')
      .isIn(['multiple_choice', 'short_answer'])
      .withMessage('Type must be multiple_choice or short_answer'),
    body('option_a').optional().trim(),
    body('option_b').optional().trim(),
    body('option_c').optional().trim(),
    body('option_d').optional().trim(),
    body('correct_answer')
      .optional()
      .isIn(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'])
      .withMessage('Correct answer must be A, B, C, or D'),
  ],
  validate,
  addQuestionController
);

// ── PATCH /api/courses/:course_id/exam/questions/:question_id ─
router.patch(
  '/questions/:question_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [param('question_id').isInt({ min: 1 })],
  validate,
  updateQuestionController
);

// ── DELETE /api/courses/:course_id/exam/questions/:question_id
router.delete(
  '/questions/:question_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [param('question_id').isInt({ min: 1 })],
  validate,
  deleteQuestionController
);

// ── POST /api/courses/:course_id/exam/submit ──────────────────
router.post(
  '/submit',
  authenticate,
  authorizeRoles('learner'),
  [
    body('answers')
      .isArray({ min: 1 })
      .withMessage('Answers array is required'),
    body('answers.*.question_id')
      .isInt({ min: 1 })
      .withMessage('Each answer must have a valid question_id'),
    body('answers.*.answer_text')
      .notEmpty()
      .withMessage('Each answer must have answer_text'),
  ],
  validate,
  submitExamController
);

// ── GET /api/courses/:course_id/exam/result ───────────────────
router.get(
  '/result',
  authenticate,
  authorizeRoles('learner'),
  getExamResultController
);

// ── GET /api/courses/:course_id/exam/submissions ──────────────
router.get(
  '/submissions',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  getSubmissionsController
);

// ── PATCH /api/courses/:course_id/exam/answers/:answer_id ─────
router.patch(
  '/answers/:answer_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [
    param('answer_id').isInt({ min: 1 }),
    body('is_correct').isBoolean().withMessage('is_correct must be true or false'),
  ],
  validate,
  gradeAnswerController
);

export default router;