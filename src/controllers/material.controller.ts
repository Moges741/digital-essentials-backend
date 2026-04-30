import { Request, Response, NextFunction } from 'express';
import {
  uploadMaterialService,
  listMaterialsService,
  getMaterialService,
  deleteMaterialService,
} from '../services/material.service';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import { UploadMaterialBody } from '../types/material.types';

// ─── UPLOAD ───────────────────────────────────────────────────
export const uploadMaterialController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check file was actually sent
    if (!req.file) {
      sendError(res, 'No file uploaded', 400);
      return;
    }

    const course_idParam = req.params.course_id;
    const course_id = parseInt(Array.isArray(course_idParam) ? course_idParam[0] : course_idParam, 10);
    const material  = await uploadMaterialService(
      course_id,
      req.body as UploadMaterialBody,
      req.file,
      req.user!
    );
    sendSuccess(res, { material }, 'Material uploaded successfully', 201);
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── LIST ─────────────────────────────────────────────────────
export const listMaterialsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course_idParam = req.params.course_id;
    const course_id = parseInt(Array.isArray(course_idParam) ? course_idParam[0] : course_idParam, 10);
    const materials = await listMaterialsService(course_id);
    sendSuccess(res, { materials }, 'Materials retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── GET ONE ──────────────────────────────────────────────────
export const getMaterialController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const material_idParam = req.params.material_id;
    const material_id = parseInt(Array.isArray(material_idParam) ? material_idParam[0] : material_idParam  , 10);
    const material    = await getMaterialService(material_id);
    sendSuccess(res, { material }, 'Material retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── DELETE ───────────────────────────────────────────────────
export const deleteMaterialController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const material_idParam = req.params.material_id;
    const material_id = parseInt(Array.isArray(material_idParam) ? material_idParam[0] : material_idParam  , 10);
    await deleteMaterialService(material_id, req.user!);
    sendSuccess(res, null, 'Material deleted successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};