import { Request, Response, NextFunction } from 'express';
import {
  createFeedbackService,
  getFeedbackService,
  updateFeedbackService,
  deleteFeedbackService,
  listFeedbackByCourseService,
} from '../services/feedback.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import {
  CreateFeedbackBody,
  UpdateFeedbackBody,
} from '../types/feedback.types';

// ─── CREATE ───────────────────────────────────────────────────
export const createFeedbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const enrollment_idParam = req.params.enrollment_id;
    const enrollment_id = parseInt(Array.isArray(enrollment_idParam) ? enrollment_idParam[0] : enrollment_idParam, 10);
    const feedback = await createFeedbackService(
      enrollment_id,
      req.body as CreateFeedbackBody,
      req.user!
    );
    sendSuccess(res, { feedback }, 'Feedback submitted successfully', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── GET ─────────────────────────────────────────────────────
export const getFeedbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const enrollment_idParam = req.params.enrollment_id;
    const enrollment_id = parseInt(Array.isArray(enrollment_idParam) ? enrollment_idParam[0] : enrollment_idParam, 10);
    const feedback = await getFeedbackService(enrollment_id, req.user!);
    sendSuccess(res, { feedback }, 'Feedback retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── UPDATE ──────────────────────────────────────────────────
export const updateFeedbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const feedback_idParam = req.params.feedback_id;
    const feedback_id = parseInt(Array.isArray(feedback_idParam) ? feedback_idParam[0] : feedback_idParam, 10);
    const feedback = await updateFeedbackService(
      feedback_id,
      req.body as UpdateFeedbackBody,
      req.user!
    );
    sendSuccess(res, { feedback }, 'Feedback updated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── DELETE ───────────────────────────────────────────────────
export const deleteFeedbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const feedback_idParam = req.params.feedback_id;
    const feedback_id = parseInt(Array.isArray(feedback_idParam) ? feedback_idParam[0] : feedback_idParam, 10);
    await deleteFeedbackService(feedback_id, req.user!);
    sendSuccess(res, null, 'Feedback deleted successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── LIST BY COURSE ───────────────────────────────────────────
export const listFeedbackByCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_idParam = req.params.course_id;
    const course_id = parseInt(Array.isArray(course_idParam) ? course_idParam[0] : course_idParam, 10);
    const feedback = await listFeedbackByCourseService(course_id, req.user!);
    sendSuccess(res, { feedback }, 'Feedback retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};