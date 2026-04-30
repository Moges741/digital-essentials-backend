import { Router }     from 'express';
import { body, param } from 'express-validator';
import {
  uploadMaterialController,
  listMaterialsController,
  getMaterialController,
  deleteMaterialController,
} from '../controllers/material.controller';
import { authenticate, authorizeRoles, optionalAuthenticate } from '../middleware/auth.middleware';
import { validate }   from '../middleware/validate.middleware';
import { upload }     from '../config/multer';

// mergeParams: true — needed to access :course_id from parent route
const router = Router({ mergeParams: true });

// ── GET /api/courses/:course_id/materials ─────────────────────
// Public for published courses
router.get(
  '/',
  optionalAuthenticate,
  listMaterialsController
);

// ── GET /api/courses/:course_id/materials/:material_id ────────
router.get(
  '/:material_id',
  optionalAuthenticate,
  [param('material_id').isInt({ min: 1 }).withMessage('Invalid material ID')],
  validate,
  getMaterialController
);

// ── POST /api/courses/:course_id/materials ────────────────────
// multipart/form-data — upload.single('file') processes the file
// 'file' must match the field name in your API client
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
    body('lesson_id')
      .optional()
      .isInt({ min: 1 }).withMessage('lesson_id must be a valid integer'),
    body('is_downloadable')
      .optional()
      .isIn(['true', 'false']).withMessage('is_downloadable must be true or false'),
  ],
  validate,
  uploadMaterialController
);

// ── DELETE /api/courses/:course_id/materials/:material_id ─────
router.delete(
  '/:material_id',
  authenticate,
  authorizeRoles('mentor', 'administrator'),
  [param('material_id').isInt({ min: 1 }).withMessage('Invalid material ID')],
  validate,
  deleteMaterialController
);

export default router;