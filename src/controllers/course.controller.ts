import { Request, Response, NextFunction } from 'express';
import {
  createCourseService,
  getCourseService,
  listCoursesService,
  updateCourseService,
  publishCourseService,
  deleteCourseService,
} from '../services/course.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import { CreateCourseBody, UpdateCourseBody, CourseQueryParams } from '../types/course.types';
// ─── CREATE ───────────────────
export const createCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course = await createCourseService(
      req.body as CreateCourseBody,
      req.user!
    );
    sendSuccess(res, { course }, 'Course created successfully', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── LIST ────────────────────
export const listCoursesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await listCoursesService(
      req.query as CourseQueryParams,
      req.user  
    );
    sendSuccess(res, result, 'Courses retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── GET ONE ────────────────
export const getCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_id = parseInt(req.params.course_id, 10);
    const course = await getCourseService(course_id, req.user);
    sendSuccess(res, { course }, 'Course retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── UPDATE ──────────────
export const updateCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_id = parseInt(req.params.course_id, 10);
    const course = await updateCourseService(
      course_id,
      req.body as UpdateCourseBody,
      req.user!
    );
    sendSuccess(res, { course }, 'Course updated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── PUBLISH / UNPUBLISH ─────────────
export const publishCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_id  = parseInt(req.params.course_id, 10);
    const is_published = req.body.is_published as boolean;
    const course = await publishCourseService(course_id, is_published, req.user!);
    const message = is_published ? 'Course published' : 'Course unpublished';
    sendSuccess(res, { course }, message);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── DELETE ───────────────────
export const deleteCourseController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_id = parseInt(req.params.course_id, 10);
    await deleteCourseService(course_id, req.user!);
    sendSuccess(res, null, 'Course deleted successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};