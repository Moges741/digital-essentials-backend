import {
  createCourse,
  findCourseById,
  findCourseWithLessons,
  listCourses,
  listAllCourses,
  updateCourse,
  togglePublish,
  deleteCourse,
} from '../models/course.model';
import {
  CourseWithCreator,
  CourseWithLessons,
  CreateCourseBody,
  UpdateCourseBody,
  CourseQueryParams,
  PaginatedCourses,
} from '../types/course.types';
import { JwtPayload } from '../types/auth.types';
import {
  NotFoundError,
  ForbiddenError,
} from '../utils/errors';

// ─── CREATE ────────────
export const createCourseService = async (
  body: CreateCourseBody,
  user: JwtPayload
): Promise<CourseWithCreator> => {

  const course_id = await createCourse(body, user.user_id);

// Fetch and return the full created course
  const course = await findCourseById(course_id);
  return course!;
};

// ─── GET ONE ─────────────────
export const getCourseService = async (
  course_id: number,
  user?: JwtPayload  
): Promise<CourseWithLessons> => {

  const course = await findCourseWithLessons(course_id);

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  // Unpublished courses visible only to admin or the creator
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

  return course;
};

// ─── LIST (public) ────────
export const listCoursesService = async (
  query: CourseQueryParams,
  user?: JwtPayload
): Promise<PaginatedCourses> => {

  const page  = Math.max(1, parseInt(query.page  ?? '1',  10));
  const limit = Math.min(50, parseInt(query.limit ?? '10', 10));

  // Admins see all courses including unpublished
  if (user?.role === 'administrator') {
    return listAllCourses(page, limit, query.search);
  }

  return listCourses(page, limit, query.search);
};

// ─── UPDATE ───────────────────────────────────────────────────
export const updateCourseService = async (
  course_id: number,
  body: UpdateCourseBody,
  user: JwtPayload
): Promise<CourseWithCreator> => {

  const course = await findCourseById(course_id);

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  // Mentor can only update their own course
  // Administrator can update any course
  const isAdmin   = user.role === 'administrator';
  const isCreator = course.created_by === user.user_id;

  if (!isAdmin && !isCreator) {
    throw new ForbiddenError('You can only update your own courses');
  }

  await updateCourse(course_id, body);

  const updated = await findCourseById(course_id);
  return updated!;
};

// ─── PUBLISH / UNPUBLISH ───────────────────
export const publishCourseService = async (
  course_id: number,
  is_published: boolean,
  user: JwtPayload
): Promise<CourseWithCreator> => {

  const course = await findCourseById(course_id);

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  const isAdmin   = user.role === 'administrator';
  const isCreator = course.created_by === user.user_id;

  if (!isAdmin && !isCreator) {
    throw new ForbiddenError('You can only publish your own courses');
  }

  await togglePublish(course_id, is_published);

  const updated = await findCourseById(course_id);
  return updated!;
};

// ─── DELETE ───────────────────────────
export const deleteCourseService = async (
  course_id: number,
  user: JwtPayload
): Promise<void> => {

  const course = await findCourseById(course_id);

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  // Only administrator can delete courses
  // This protects mentors from accidentally losing all their content
  if (user.role !== 'administrator') {
    throw new ForbiddenError('Only administrators can delete courses');
  }

  await deleteCourse(course_id);
};