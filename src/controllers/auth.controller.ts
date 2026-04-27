import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import { RegisterBody, LoginBody } from '../types/auth.types';

// ─── REGISTER ─────────────────────────────────────────────────
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body as RegisterBody;
    const user = await registerUser(body);
    sendSuccess(res, { user }, 'Account created successfully', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── LOGIN ────────────────────────────────────────────────────
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body as LoginBody;
    const result = await loginUser(body);
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};