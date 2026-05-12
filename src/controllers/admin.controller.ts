import { Request, Response, NextFunction } from 'express';
import db from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { SafeUser } from '../models/user.model';
import { CourseWithCreator } from '../types/course.types';

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