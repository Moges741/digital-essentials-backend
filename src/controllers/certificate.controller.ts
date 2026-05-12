// src/controllers/certificate.controller.ts

import { Request, Response, NextFunction } from 'express';
import {
  getCertificateService,
  listMyCertificatesService,
  updateCertificateUrlService,
  deleteCertificateService,
} from '../services/certificate.service';
import { generateCertificateService } from '../services/certificate.service';
import { findCertificateByUserAndCourse } from '../models/certificate.model';
import { findEnrollmentByUserAndCourse }  from '../models/enrollment.model';
import { sendSuccess, sendError }         from '../utils/response';
import { AppError, ValidationError, NotFoundError } from '../utils/errors';

// ── ISSUE CERTIFICATE ─────────────────────────────────────────
// Learner triggers their own certificate
// course_id from body, user_id from JWT token
export const issueCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user_id   = req.user!.user_id;
    const course_id = parseInt(req.body.course_id, 10);

    // Check enrollment is completed
    const enrollment = await findEnrollmentByUserAndCourse(
      user_id,
      course_id
    );

    if (!enrollment) {
      sendError(res, 'You are not enrolled in this course', 403);
      return;
    }

    if (enrollment.status !== 'completed') {
      sendError(
        res,
        'You must complete all lessons before receiving a certificate',
        400
      );
      return;
    }

    // Check if certificate already exists
    const existing = await findCertificateByUserAndCourse(
      user_id,
      course_id
    );

    if (existing) {
      // Certificate already exists — just return it
      sendSuccess(
        res,
        { certificate: existing },
        'Certificate already issued',
        200
      );
      return;
    }

    // Generate real PDF certificate
    await generateCertificateService(user_id, course_id);

    // Fetch the newly created certificate to return it
    const certificate = await findCertificateByUserAndCourse(
      user_id,
      course_id
    );

    sendSuccess(
      res,
      { certificate },
      'Certificate issued successfully',
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ── GET ONE CERTIFICATE ───────────────────────────────────────
export const getCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const certificate_id = parseInt(
      Array.isArray(req.params.certificate_id)
        ? req.params.certificate_id[0]
        : req.params.certificate_id,
      10
    );
    const certificate    = await getCertificateService(
      certificate_id,
      req.user!
    );
    sendSuccess(res, { certificate }, 'Certificate retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ── LIST MY CERTIFICATES ──────────────────────────────────────
export const listMyCertificatesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const certificates = await listMyCertificatesService(req.user!);
    sendSuccess(
      res,
      { certificates },
      'Certificates retrieved successfully'
    );
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ── UPDATE CERTIFICATE URL (admin only) ───────────────────────
export const updateCertificateUrlController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const certificate_id  = parseInt(Array.isArray(req.params.certificate_id) ? req.params.certificate_id[0] : req.params.certificate_id, 10);
    const { certificate_url } = req.body;
    await updateCertificateUrlService(
      certificate_id,
      certificate_url,
      req.user!
    );
    sendSuccess(res, null, 'Certificate URL updated successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ── DELETE CERTIFICATE (admin only) ──────────────────────────
export const deleteCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const certificate_id = parseInt(
      Array.isArray(req.params.certificate_id)
        ? req.params.certificate_id[0]
        : req.params.certificate_id,
      10
    );
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

// ── DOWNLOAD CERTIFICATE ──────────────────────────────────────
// Redirects browser to Cloudinary PDF URL
export const downloadCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const certificate_id = parseInt(
      Array.isArray(req.params.certificate_id)
        ? req.params.certificate_id[0]
        : req.params.certificate_id,
      10
    );
    const certificate    = await getCertificateService(
      certificate_id,
      req.user!
    );

    if (!certificate.certificate_url) {
      sendError(res, 'Certificate file not yet generated', 404);
      return;
    }

    res.redirect(certificate.certificate_url);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};