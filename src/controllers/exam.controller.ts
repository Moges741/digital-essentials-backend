// src/controllers/exam.controller.ts

import { Request, Response, NextFunction } from 'express';
import {
  createExamService,
  getExamForMentorService,
  getExamForLearnerService,
  updateExamService,
  deleteExamService,
  addQuestionService,
  updateQuestionService,
  deleteQuestionService,
  submitExamService,
  getExamResultService,
  getExamSubmissionsService,
  getExamSubmissionWithAnswersService,
  gradeAnswerService,
} from '../services/exam.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError }               from '../utils/errors';
// import type { ROLES }                  from '../utils/roleConstants';

// Helper to parse course_id param
const parseCourseId = (req: Request) =>
  parseInt(req.params.course_id as string, 10);

// ── CREATE EXAM ───────────────────────────────────────────────
export const createExamController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const exam = await createExamService(
      parseCourseId(req), req.body, req.user!
    );
    sendSuccess(res, { exam }, 'Final exam created', 201);
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};

// ── GET EXAM (role-aware) ─────────────────────────────────────
export const getExamController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const course_id = parseCourseId(req);
    const role = req.user!.role;

    if (role === 'learner') {
      const exam = await getExamForLearnerService(course_id, req.user!);
      sendSuccess(res, { exam }, 'Exam retrieved');
    } else {
      const exam = await getExamForMentorService(course_id, req.user!);
      sendSuccess(res, { exam }, 'Exam retrieved');
    }
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};

// ── UPDATE EXAM ───────────────────────────────────────────────
export const updateExamController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const exam = await updateExamService(
      parseCourseId(req), req.body.passing_score, req.user!
    );
    sendSuccess(res, { exam }, 'Exam updated');
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};

// ── DELETE EXAM ───────────────────────────────────────────────
export const deleteExamController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    await deleteExamService(parseCourseId(req), req.user!);
    sendSuccess(res, null, 'Exam deleted');
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};

// ── ADD QUESTION ──────────────────────────────────────────────
export const addQuestionController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const question = await addQuestionService(
      parseCourseId(req), req.body, req.user!
    );
    sendSuccess(res, { question }, 'Question added', 201);
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};

// ── UPDATE QUESTION ───────────────────────────────────────────
export const updateQuestionController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const question_id = parseInt(req.params.question_id as string, 10);
    const question    = await updateQuestionService(
      parseCourseId(req), question_id, req.body, req.user!
    );
    sendSuccess(res, { question }, 'Question updated');
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};

// ── DELETE QUESTION ───────────────────────────────────────────
export const deleteQuestionController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const question_id = parseInt(req.params.question_id as string, 10);
    await deleteQuestionService(
      parseCourseId(req), question_id, req.user!
    );
    sendSuccess(res, null, 'Question deleted');
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};

// ── SUBMIT EXAM ───────────────────────────────────────────────
export const submitExamController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const result = await submitExamService(
      parseCourseId(req), req.body, req.user!
    );
    sendSuccess(res, { result }, 'Exam submitted', 201);
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};

// ── GET MY RESULT ─────────────────────────────────────────────
export const getExamResultController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const result = await getExamResultService(
      parseCourseId(req), req.user!
    );
    sendSuccess(res, { result }, 'Result retrieved');
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};

// ── GET ALL SUBMISSIONS ───────────────────────────────────────
export const getSubmissionsController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const submissions = await getExamSubmissionsService(
      parseCourseId(req), req.user!
    );
    sendSuccess(res, { submissions }, 'Submissions retrieved');
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};
// ── GET SINGLE SUBMISSION ────────────────────────────────────
export const getSubmissionController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const submission_id = parseInt(req.params.submission_id as string, 10);
    const submission = await getExamSubmissionWithAnswersService(
      parseCourseId(req), submission_id, req.user!
    );
    sendSuccess(res, { submission }, 'Submission retrieved');
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};
// ── GRADE ANSWER ──────────────────────────────────────────────
export const gradeAnswerController = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const answer_id = parseInt(req.params.answer_id as string, 10);
    const result = await gradeAnswerService(answer_id, req.body, req.user!);
    sendSuccess(res, { result }, 'Answer graded');
  } catch (e) {
    e instanceof AppError ? sendError(res, e.message, e.statusCode) : next(e);
  }
};