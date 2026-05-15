import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, verifyEmailAddress, resendVerificationEmail } from '../services/auth.service';
import { forgotPassword, resetPassword } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import { RegisterBody, LoginBody, VerifyEmailBody, ResendVerificationBody } from '../types/auth.types';
import type { } from '../types/auth.types';

// ─── REGISTER ─────────────────────────────────────────────────
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body as RegisterBody;
    const result = await registerUser(body);
    sendSuccess(res, result, 'Account created successfully. Please verify your email.', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── VERIFY EMAIL ────────────────────────────────────────────
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body as VerifyEmailBody;
    const result = await verifyEmailAddress(body.token);
    sendSuccess(res, result, 'Email verified successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── RESEND VERIFICATION EMAIL ───────────────────────────────
export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body as ResendVerificationBody;
    await resendVerificationEmail(body.email);
    sendSuccess(res, null, 'Verification email sent');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────
export const forgotPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body as { email: string };
    await forgotPassword(email);
    sendSuccess(res, null, 'Password reset email sent');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── RESET PASSWORD ──────────────────────────────────────────
export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    await resetPassword(token, password);
    sendSuccess(res, null, 'Password has been reset');
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