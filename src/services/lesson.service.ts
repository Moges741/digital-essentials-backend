import {
  createLesson,
  findLessonById,
  findLessonWithMaterials,
  listLessonsByCourse,
  updateLesson,
  deleteLesson,
  lessonBelongsToCourse,
} from '../models/lesson.model';
import { findCourseById } from '../models/course.model';
import {
  Lesson,
  LessonWithMaterials,
  CreateLessonBody,
  UpdateLessonBody,
} from '../types/lesson.types';
import { JwtPayload } from '../types/auth.types';
import {
  NotFoundError,
  ForbiddenError,
} from '../utils/errors';

// ─── Helper: verify course exists and user has access ─────────
// Reused by create, update, delete
const verifyCourseOwnership = async (
  course_id: number,
  user: JwtPayload
): Promise<void> => {

  const course = await findCourseById(course_id);

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  const isAdmin   = user.role === 'administrator';
  const isCreator = course.created_by === user.user_id;

  if (!isAdmin && !isCreator) {
    throw new ForbiddenError('You can only manage lessons in your own courses');
  }
};

// ─── Helper: verify lesson belongs to course ──────────────────
const verifyLessonInCourse = async (
  lesson_id: number,
  course_id: number
): Promise<Lesson> => {

  const belongs = await lessonBelongsToCourse(lesson_id, course_id);

  if (!belongs) {
    throw new NotFoundError('Lesson not found in this course');
  }

  const lesson = await findLessonById(lesson_id);
  return lesson!;
};

// ─── CREATE ──────────────────
export const createLessonService = async (
  course_id: number,
  body: CreateLessonBody,
  user: JwtPayload
): Promise<Lesson> => {

  // Check course exists and user owns it
  await verifyCourseOwnership(course_id, user);

  const lesson_id = await createLesson(course_id, body);
  const lesson    = await findLessonById(lesson_id);

  return lesson!;
};

// ─── LIST ───────────────────────────
export const listLessonsService = async (
  course_id: number,
  user?: JwtPayload
): Promise<Lesson[]> => {

  const course = await findCourseById(course_id);

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  // Unpublished course — only creator and admin can see lessons
  if (!course.is_published) {
    if (!user) {
      throw new NotFoundError('Course not found');
    }
    const isAdmin   = user.role === 'administrator';
    const isCreator = course.created_by === user.user_id;
    if (!isAdmin && !isCreator) {
      throw new NotFoundError('Course not found');
    }
  }

  return listLessonsByCourse(course_id);
};

// ─── GET ONE ────────────────────────
export const getLessonService = async (
  course_id: number,
  lesson_id: number,
  user?: JwtPayload
): Promise<LessonWithMaterials> => {

  const course = await findCourseById(course_id);

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  // Same published check as list
  if (!course.is_published) {
    if (!user) throw new NotFoundError('Course not found');
    const isAdmin   = user.role === 'administrator';
    const isCreator = course.created_by === user.user_id;
    if (!isAdmin && !isCreator) throw new NotFoundError('Course not found');
  }

  await verifyLessonInCourse(lesson_id, course_id);

  const lesson = await findLessonWithMaterials(lesson_id);
  return lesson!;
};

// ─── UPDATE ─────────────────────────
export const updateLessonService = async (
  course_id: number,
  lesson_id: number,
  body: UpdateLessonBody,
  user: JwtPayload
): Promise<Lesson> => {

  await verifyCourseOwnership(course_id, user);
  await verifyLessonInCourse(lesson_id, course_id);

  await updateLesson(lesson_id, body);

  const updated = await findLessonById(lesson_id);
  return updated!;
};

// ─── DELETE ──────────────
export const deleteLessonService = async (
  course_id: number,
  lesson_id: number,
  user: JwtPayload
): Promise<void> => {

  await verifyCourseOwnership(course_id, user);
  await verifyLessonInCourse(lesson_id, course_id);

  await deleteLesson(lesson_id);
};