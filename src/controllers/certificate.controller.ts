import { Request, Response, NextFunction } from 'express';
import {
  issueCertificateService,
  getCertificateService,
  listMyCertificatesService,
  updateCertificateUrlService,
  deleteCertificateService,
} from '../services/certificate.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';

// ─── ISSUE CERTIFICATE ────────────────────────────────────────
export const issueCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user_idParam = req.params.user_id;
    const user_id = parseInt(Array.isArray(user_idParam) ? user_idParam[0] : user_idParam, 10);
    const course_idParam = req.params.course_id;
    const course_id = parseInt(Array.isArray(course_idParam) ? course_idParam[0] : course_idParam, 10);
    const certificate = await issueCertificateService(user_id, course_id, req.user!);
    sendSuccess(res, { certificate }, 'Certificate issued successfully', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── GET CERTIFICATE ──────────────────────────────────────────
export const getCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const certificate_idParam = req.params.certificate_id;
    const certificate_id = parseInt(Array.isArray(certificate_idParam) ? certificate_idParam[0] : certificate_idParam, 10);
    const certificate = await getCertificateService(certificate_id, req.user!);
    sendSuccess(res, { certificate }, 'Certificate retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── LIST MY CERTIFICATES ─────────────────────────────────────
export const listMyCertificatesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const certificates = await listMyCertificatesService(req.user!);
    sendSuccess(res, { certificates }, 'Certificates retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── UPDATE CERTIFICATE URL ───────────────────────────────────
export const updateCertificateUrlController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const certificate_idParam = req.params.certificate_id;
    const certificate_id = parseInt(Array.isArray(certificate_idParam) ? certificate_idParam[0] : certificate_idParam, 10);
    const { certificate_url } = req.body;
    await updateCertificateUrlService(certificate_id, certificate_url, req.user!);
    sendSuccess(res, null, 'Certificate URL updated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── DELETE CERTIFICATE ───────────────────────────────────────
export const deleteCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const certificate_idParam = req.params.certificate_id;
    const certificate_id = parseInt(Array.isArray(certificate_idParam) ? certificate_idParam[0] : certificate_idParam, 10);
    await deleteCertificateService(certificate_id, req.user!);
    sendSuccess(res, null, 'Certificate deleted successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};