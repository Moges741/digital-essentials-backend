// src/routes/auth.routes.ts

import { Router } from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// ─── POST /api/auth/register ──────────────────────────────────
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),

    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['learner', 'mentor', 'administrator']).withMessage('Role must be learner, mentor or administrator'),

    body('specialization')
      .if(body('role').equals('mentor'))
      .notEmpty().withMessage('Specialization is required for mentors'),
  ],
  validate,
  register
);

// ─── POST /api/auth/login ─────────────────────────────────────
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),

    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

export default router;