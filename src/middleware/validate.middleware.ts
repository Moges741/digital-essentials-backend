import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/response';

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Return all validation errors at once
    // so the client knows everything wrong in one response
    sendError(
      res,
      'Validation failed',
      400,
      errors.array().map(e => e.msg)
    );
    return;
  }

  next();
};