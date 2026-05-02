import { Router } from 'express';
import {
  sendMessageController,
  getHistoryController,
  clearHistoryController,
} from '../controllers/chat.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { body, query } from 'express-validator'; 

const router = Router();

router.use(authenticate);


router.post(
  '/send',
  authorizeRoles('learner'),
  [
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message cannot be empty')
      .isLength({ max: 2000 })
      .withMessage('Message must be under 2000 characters')
      .escape(), // sanitize against XSS
    body('session_id')
      .optional()
      .isUUID()
      .withMessage('session_id must be a valid UUID'),
  ],
  validate,
  sendMessageController
);


router.get(
  '/history',
  authorizeRoles('learner'),
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('offset must be 0 or greater'),
    query('session_id')
      .optional()
      .isUUID()
      .withMessage('session_id must be a valid UUID'),
  ],
  validate,
  getHistoryController
);


router.delete(
  '/history',
  authorizeRoles('learner', 'mentor', 'administrator'),
  [
    query('session_id')
      .optional()
      .isUUID()
      .withMessage('session_id must be a valid UUID'),
  ],
  validate,
  clearHistoryController
);

export default router;