import { Request, Response, NextFunction } from 'express';
import {
  markCompleteService,
  syncOfflineProgressService,
  getCourseProgressService,
  getCourseProgressAdminService,
} from '../services/progress.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import { SyncProgressBody } from '../types/progress.types';

// ─── MARK COMPLETE ────────────────────────────────────────────
export const markCompleteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lesson_idParam = req.params.lesson_id;
    const lesson_id = parseInt(Array.isArray(lesson_idParam) ? lesson_idParam[0] : lesson_idParam, 10);
    await markCompleteService(lesson_id, req.user!);
    sendSuccess(res, null, 'Lesson marked as complete');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── SYNC OFFLINE PROGRESS ────────────────────────────────────
export const syncProgressController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await syncOfflineProgressService(
      req.body as SyncProgressBody,
      req.user!
    );
    sendSuccess(res, result, 'Offline progress synced');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── MY COURSE PROGRESS ────────────────
export const getCourseProgressController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_idParam = req.params.course_id;
    const course_id = parseInt(Array.isArray(course_idParam) ? course_idParam[0] : course_idParam, 10);
    const summary = await getCourseProgressService(course_id, req.user!);
    sendSuccess(res, { summary }, 'Progress retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── LEARNER PROGRESS (mentor/admin view) ────────────────────
export const getLearnerProgressController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_idParam      = req.params.course_id;
    const course_id           = parseInt(Array.isArray(course_idParam) ? course_idParam[0] : course_idParam, 10);
    const target_user_idParam = req.params.user_id;
    const target_user_id      = parseInt(Array.isArray(target_user_idParam) ? target_user_idParam[0] : target_user_idParam, 10);
    const summary = await getCourseProgressAdminService(
      course_id,
      target_user_id,
      req.user!
    );
    sendSuccess(res, { summary }, 'Learner progress retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};