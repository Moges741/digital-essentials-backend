import { Request, Response, NextFunction } from 'express';
import {
  enrollService,
  getMyEnrollmentsService,
  getCourseEnrollmentsService,
  dropEnrollmentService,
} from '../services/enrollment.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import { CreateEnrollmentBody } from '../types/enrollment.types';

// ─── ENROLL ────────────────
export const enrollController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const enrollment = await enrollService(
      req.body as CreateEnrollmentBody,
      req.user!
    );
    sendSuccess(res, { enrollment }, 'Enrolled successfully', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── MY ENROLLMENTS ─────────────
export const getMyEnrollmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const enrollments = await getMyEnrollmentsService(req.user!);
    sendSuccess(res, { enrollments }, 'Enrollments retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── COURSE ENROLLMENTS ───────────
export const getCourseEnrollmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_idParam = req.params.course_id;
    const course_id = parseInt(Array.isArray(course_idParam) ? course_idParam[0] : course_idParam, 10);
    const enrollments = await getCourseEnrollmentsService(course_id, req.user!);
    sendSuccess(res, { enrollments }, 'Course enrollments retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── DROP ──────────────────
export const dropEnrollmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const enrollment_idParam = req.params.enrollment_id;
    const enrollment_id = parseInt(
      Array.isArray(enrollment_idParam) ? enrollment_idParam[0] : enrollment_idParam,
      10
    );
    await dropEnrollmentService(enrollment_id, req.user!);
    sendSuccess(res, null, 'Enrollment dropped successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};