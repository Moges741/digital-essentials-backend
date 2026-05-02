import { Request, Response, NextFunction } from 'express';
import {
  createExerciseService,
  listExercisesService,
  getExerciseService,
  deleteExerciseService,
  submitExerciseService,
  getSubmissionsService,
  getMySubmissionsService,
} from '../services/exercise.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError }               from '../utils/errors';
import {
  CreateExerciseBody,
  SubmitExerciseBody,
} from '../types/exercise.types';

// ─── CREATE ───────────────────────────────────────────────────
export const createExerciseController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_idParam = req.params.course_id;
    const course_id = parseInt(Array.isArray(course_idParam) ? course_idParam[0] : course_idParam, 10);
    const exercise  = await createExerciseService(
      course_id,
      req.body as CreateExerciseBody,
      req.user!,
      req.file
    );
    sendSuccess(res, { exercise }, 'Exercise created successfully', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── LIST ─────────────────────────────────────────────────────
export const listExercisesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_idParam = req.params.course_id;
    const course_id = parseInt(Array.isArray(course_idParam) ? course_idParam[0] : course_idParam, 10);
    const exercises = await listExercisesService(course_id, req.user!);
    sendSuccess(res, { exercises }, 'Exercises retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── GET ONE ──────────────────────────────────────────────────
export const getExerciseController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const exercise_idParam = req.params.exercise_id;
    const exercise_id = parseInt(Array.isArray(exercise_idParam) ? exercise_idParam[0] : exercise_idParam, 10);
    const exercise    = await getExerciseService(exercise_id, req.user!);
    sendSuccess(res, { exercise }, 'Exercise retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── DELETE ───────────────────────────────────────────────────
export const deleteExerciseController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const exercise_idParam = req.params.exercise_id;
    const exercise_id = parseInt(Array.isArray(exercise_idParam) ? exercise_idParam[0] : exercise_idParam, 10);
    await deleteExerciseService(exercise_id, req.user!);
    sendSuccess(res, null, 'Exercise deleted successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── SUBMIT ───────────────────────────────────────────────────
export const submitExerciseController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const exercise_idParam = req.params.exercise_id;
    const exercise_id = parseInt(Array.isArray(exercise_idParam) ? exercise_idParam[0] : exercise_idParam, 10);
    const submission  = await submitExerciseService(
      exercise_id,
      req.body as SubmitExerciseBody,
      req.user!
    );
    sendSuccess(res, { submission }, 'Exercise submitted successfully', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── GET SUBMISSIONS (mentor view) ────────────────────────────
export const getSubmissionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const exercise_idParam = req.params.exercise_id;
    const exercise_id = parseInt(Array.isArray(exercise_idParam) ? exercise_idParam[0] : exercise_idParam, 10);
    const submissions = await getSubmissionsService(exercise_id, req.user!);
    sendSuccess(res, { submissions }, 'Submissions retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── MY SUBMISSIONS ───────────────────────────────────────────
export const getMySubmissionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_idParam = req.params.course_id;
    const course_id = parseInt(Array.isArray(course_idParam) ? course_idParam[0] : course_idParam, 10);
    const submissions = await getMySubmissionsService(course_id, req.user!);
    sendSuccess(res, { submissions }, 'Your submissions retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};