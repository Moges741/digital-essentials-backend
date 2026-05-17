import { Request, Response, NextFunction } from 'express';
import db from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { SafeUser } from '../models/user.model';
import { CourseWithCreator } from '../types/course.types';
import { listAllFeedbackService } from '../services/feedback.service';
import { AppError } from '../utils/errors';

// ─── Get all mentors with profiles (admin only) ──────────────
export const getAllMentors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentors = await db('users')
      .join('mentor_profiles', 'users.user_id', 'mentor_profiles.user_id')
      .select(
        'users.user_id',
        'users.name',
        'users.email',
        'users.is_active',
        'users.created_at',
        'users.updated_at',
        'mentor_profiles.specialization',
        'mentor_profiles.qualifications'
      )
      .where('users.role', 'mentor')
      .orderBy('users.created_at', 'desc');

    sendSuccess(res, { mentors }, 'Mentors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Update mentor profile (admin only) ──────────────────────
export const updateMentorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id } = req.params;
    const { specialization, qualifications } = req.body;

    if (!specialization || specialization.trim() === '') {
      sendError(res, 'Specialization is required', 400);
      return;
    }

    const userId = Array.isArray(user_id) ? user_id[0] : user_id;
    const parsedUserId = parseInt(userId);

    // Verify user exists and is a mentor
    const mentor = await db('users')
      .where({ user_id: parsedUserId, role: 'mentor' })
      .first();

    if (!mentor) {
      sendError(res, 'Mentor not found', 404);
      return;
    }

    // Update mentor profile
    await db('mentor_profiles')
      .where({ user_id: parsedUserId })
      .update({
        specialization: specialization.trim(),
        qualifications: qualifications?.trim() || null,
      });

    const updated = await db('users')
      .join('mentor_profiles', 'users.user_id', 'mentor_profiles.user_id')
      .select(
        'users.user_id',
        'users.name',
        'users.email',
        'users.is_active',
        'users.created_at',
        'users.updated_at',
        'mentor_profiles.specialization',
        'mentor_profiles.qualifications'
      )
      .where('users.user_id', parsedUserId)
      .first();

    sendSuccess(res, { mentor: updated }, 'Mentor profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Get all users (admin only) ──────────────────────────────
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await db('users')
      .select(
        'user_id',
        'name',
        'email',
        'role',
        'is_active',
        'created_at',
        'updated_at',
        'google_id'
      )
      .orderBy('created_at', 'desc');

    sendSuccess(res, { users }, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Update user role (admin only) ───────────────────────────
export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id } = req.params;
    const { role } = req.body;

    if (!['learner', 'mentor', 'administrator'].includes(role)) {
      sendError(res, 'Invalid role. Must be learner, mentor, or administrator', 400);
      return;
    }

    const userId = Array.isArray(user_id) ? user_id[0] : user_id;
    const updatedUser = await db('users')
      .where({ user_id: parseInt(userId) })
      .update({
        role,
        updated_at: db.fn.now(),
      })
      .returning([
        'user_id',
        'name',
        'email',
        'role',
        'is_active',
        'created_at',
        'updated_at',
        'google_id'
      ]);

    if (updatedUser.length === 0) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, { user: updatedUser[0] }, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Get all courses (admin only) ────────────────────────────
export const getAllCourses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courses = await db('courses')
      .join('users', 'courses.created_by', 'users.user_id')
      .select(
        'courses.*',
        'users.name as creator_name',
        'users.role as creator_role'
      )
      .orderBy('courses.created_at', 'desc');

    sendSuccess(res, { courses }, 'Courses retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Toggle course publish status (admin only) ──────────────
export const toggleCoursePublish = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { course_id } = req.params;
    const courseId = Array.isArray(course_id) ? course_id[0] : course_id;

    // Get current course
    const course = await db('courses')
      .where({ course_id: parseInt(courseId) })
      .first();

    if (!course) {
      sendError(res, 'Course not found', 404);
      return;
    }

    // Toggle publish status
    const updatedCourse = await db('courses')
      .where({ course_id: parseInt(courseId) })
      .update({
        is_published: !course.is_published,
        updated_at: db.fn.now(),
      })
      .returning('*');

    // Get with creator info
    const courseWithCreator = await db('courses')
      .join('users', 'courses.created_by', 'users.user_id')
      .where('courses.course_id', courseId)
      .select(
        'courses.*',
        'users.name as creator_name',
        'users.role as creator_role'
      )
      .first();

    sendSuccess(res, { course: courseWithCreator }, 'Course status updated successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Get all course feedback (admin only) ─────────────────────
export const getAllCourseFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const feedback = await listAllFeedbackService(req.user!);
    sendSuccess(res, { feedback }, 'All feedback retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
    } else {
      next(error);
    }
  }
};

// ─── Get all certificates (admin only) ───────────────────────
export const getAllCertificates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const certificates = await db('certificates')
      .join('users', 'certificates.user_id', 'users.user_id')
      .join('courses', 'certificates.course_id', 'courses.course_id')
      .select(
        'certificates.*',
        'users.name as learner_name',
        'users.email as learner_email',
        'courses.title as course_title'
      )
      .orderBy('certificates.issued_at', 'desc');

    sendSuccess(res, { certificates }, 'Certificates retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Update certificate (admin only) ─────────────────────────
export const updateCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { certificate_id } = req.params;
    const certId = parseInt(Array.isArray(certificate_id) ? certificate_id[0] : certificate_id, 10);

    if (Number.isNaN(certId) || certId < 1) {
      sendError(res, 'Invalid certificate ID', 400);
      return;
    }

    const existing = await db('certificates').where({ certificate_id: certId }).first();
    if (!existing) {
      sendError(res, 'Certificate not found', 404);
      return;
    }

    const updates: Record<string, unknown> = {};

    if (req.body.user_id !== undefined) {
      const userId = parseInt(String(req.body.user_id), 10);
      if (Number.isNaN(userId) || userId < 1) {
        sendError(res, 'Invalid user_id', 400);
        return;
      }

      const userExists = await db('users').where({ user_id: userId }).first();
      if (!userExists) {
        sendError(res, 'Selected user does not exist', 404);
        return;
      }
      updates.user_id = userId;
    }

    if (req.body.course_id !== undefined) {
      const courseId = parseInt(String(req.body.course_id), 10);
      if (Number.isNaN(courseId) || courseId < 1) {
        sendError(res, 'Invalid course_id', 400);
        return;
      }

      const courseExists = await db('courses').where({ course_id: courseId }).first();
      if (!courseExists) {
        sendError(res, 'Selected course does not exist', 404);
        return;
      }
      updates.course_id = courseId;
    }

    if (req.body.issued_at !== undefined) {
      const issuedAt = new Date(String(req.body.issued_at));
      if (Number.isNaN(issuedAt.getTime())) {
        sendError(res, 'Invalid issued_at date', 400);
        return;
      }
      updates.issued_at = issuedAt;
    }

    if (req.body.certificate_url !== undefined) {
      const certificateUrl = String(req.body.certificate_url).trim();
      updates.certificate_url = certificateUrl === '' ? null : certificateUrl;
    }

    if (Object.keys(updates).length === 0) {
      sendError(res, 'No valid fields provided for update', 400);
      return;
    }

    await db('certificates')
      .where({ certificate_id: certId })
      .update(updates);

    const certificate = await db('certificates')
      .join('users', 'certificates.user_id', 'users.user_id')
      .join('courses', 'certificates.course_id', 'courses.course_id')
      .where('certificates.certificate_id', certId)
      .select(
        'certificates.*',
        'users.name as learner_name',
        'users.email as learner_email',
        'courses.title as course_title'
      )
      .first();

    sendSuccess(res, { certificate }, 'Certificate updated successfully');
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') {
      sendError(res, 'A certificate for this user and course already exists', 409);
      return;
    }
    next(error);
  }
};

// ─── Delete certificate (admin only) ─────────────────────────
export const deleteCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { certificate_id } = req.params;
    const certId = parseInt(Array.isArray(certificate_id) ? certificate_id[0] : certificate_id, 10);

    if (Number.isNaN(certId) || certId < 1) {
      sendError(res, 'Invalid certificate ID', 400);
      return;
    }

    const deleted = await db('certificates')
      .where({ certificate_id: certId })
      .delete();

    if (!deleted) {
      sendError(res, 'Certificate not found', 404);
      return;
    }

    sendSuccess(res, null, 'Certificate deleted successfully');
  } catch (error) {
    next(error);
  }
};