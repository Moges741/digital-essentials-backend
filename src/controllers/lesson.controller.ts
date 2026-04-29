import { Request, Response, NextFunction } from 'express';
import {
  createLessonService,
  listLessonsService,
  getLessonService,
  updateLessonService,
  deleteLessonService,
} from '../services/lesson.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import { CreateLessonBody, UpdateLessonBody } from '../types/lesson.types';

// ─── Shared param parser ──────
const parseCourseAndLesson = (req: Request) => ({
  course_id: parseInt(Array.isArray(req.params.course_id) ? req.params.course_id[0] : req.params.course_id, 10),
  lesson_id: parseInt(Array.isArray(req.params.lesson_id) ? req.params.lesson_id[0] : req.params.lesson_id, 10),
});

// ─── CREATE ───────────────
export const createLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_id = parseInt(Array.isArray(req.params.course_id) ? req.params.course_id[0] : req.params.course_id, 10);
    const lesson = await createLessonService(
      course_id,
      req.body as CreateLessonBody,
      req.user!
    );
    sendSuccess(res, { lesson }, 'Lesson created successfully', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── LIST ───────────────────────
export const listLessonsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_id = parseInt(Array.isArray(req.params.course_id) ? req.params.course_id[0] : req.params.course_id, 10);
    const lessons = await listLessonsService(course_id, req.user);
    sendSuccess(res, { lessons }, 'Lessons retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── GET ONE ─────────────────
export const getLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { course_id, lesson_id } = parseCourseAndLesson(req);
    const lesson = await getLessonService(course_id, lesson_id, req.user);
    sendSuccess(res, { lesson }, 'Lesson retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── UPDATE ──────────────────────
export const updateLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { course_id, lesson_id } = parseCourseAndLesson(req);
    const lesson = await updateLessonService(
      course_id,
      lesson_id,
      req.body as UpdateLessonBody,
      req.user!
    );
    sendSuccess(res, { lesson }, 'Lesson updated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── DELETE ─────────────────
export const deleteLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { course_id, lesson_id } = parseCourseAndLesson(req);
    await deleteLessonService(course_id, lesson_id, req.user!);
    sendSuccess(res, null, 'Lesson deleted successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};