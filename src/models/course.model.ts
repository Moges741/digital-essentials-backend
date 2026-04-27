import db from '../config/db';
import {
  Course,
  CourseWithCreator,
  CourseWithLessons,
  CreateCourseBody,
  UpdateCourseBody,
  PaginatedCourses,
} from '../types/course.types';

// ─── Create a course ─────────
export const createCourse = async (
  data: CreateCourseBody,
  created_by: number
): Promise<number> => {
  const [course_id] = await db('courses').insert({
    title:         data.title,
    description:   data.description,
    duration_mins: data.duration_mins ?? 0,
    created_by,
    is_published:  false, 
  });
  return course_id;
};

// ─── Find course by ID ────────
export const findCourseById = async (
  course_id: number
): Promise<CourseWithCreator | undefined> => {
  return db('courses')
    .join('users', 'courses.created_by', 'users.user_id')
    .where('courses.course_id', course_id)
    .select(
      'courses.*',
      'users.name as creator_name',
      'users.role as creator_role'
    )
    .first();
};

// ─── Find course with its lessons ──────────────
export const findCourseWithLessons = async (
  course_id: number
): Promise<CourseWithLessons | undefined> => {
  const course = await findCourseById(course_id);

  if (!course) return undefined;

  const lessons = await db('lessons')
    .where({ course_id })
    .select('lesson_id', 'title', 'lesson_order')
    .orderBy('lesson_order', 'asc');

  return { ...course, lessons };
};

// ─── List published courses with pagination ────
export const listCourses = async (
  page: number,
  limit: number,
  search?: string
): Promise<PaginatedCourses> => {

  const offset = (page - 1) * limit;

  // Base query builder — reused for both count and data fetch
  const baseQuery = db('courses')
    .join('users', 'courses.created_by', 'users.user_id')
    .where('courses.is_published', true);

  // Apply search if provided
  if (search) {
    baseQuery.where((qb) => {
      qb.whereIlike('courses.title', `%${search}%`)
        .orWhereIlike('courses.description', `%${search}%`);
    });
  }

  // Get total count for pagination calculation
  const [{ count }] = await baseQuery
    .clone()
    .count('courses.course_id as count');

  const total = Number(count);

  // Get actual data with pagination
  const courses = await baseQuery
    .clone()
    .select(
      'courses.*',
      'users.name as creator_name',
      'users.role as creator_role'
    )
    .orderBy('courses.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    courses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ─── List ALL courses (admin view) ───────────────────
export const listAllCourses = async (
  page: number,
  limit: number,
  search?: string
): Promise<PaginatedCourses> => {

  const offset = (page - 1) * limit;

  const baseQuery = db('courses')
    .join('users', 'courses.created_by', 'users.user_id');

  if (search) {
    baseQuery.where((qb) => {
      qb.whereIlike('courses.title', `%${search}%`)
        .orWhereIlike('courses.description', `%${search}%`);
    });
  }

  const [{ count }] = await baseQuery
    .clone()
    .count('courses.course_id as count');

  const total = Number(count);

  const courses = await baseQuery
    .clone()
    .select(
      'courses.*',
      'users.name as creator_name',
      'users.role as creator_role'
    )
    .orderBy('courses.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    courses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ─── Update course ─────────────────
export const updateCourse = async (
  course_id: number,
  data: UpdateCourseBody
): Promise<void> => {
  await db('courses')
    .where({ course_id })
    .update({
      ...data,
      updated_at: db.fn.now(),
    });
};

// ─── Toggle publish status ────────────────────────────────────
export const togglePublish = async (
  course_id: number,
  is_published: boolean
): Promise<void> => {
  await db('courses')
    .where({ course_id })
    .update({ is_published, updated_at: db.fn.now() });
};

// ─── Delete course ────────────────────────────────────────────
// CASCADE in migration handles lessons, enrollments etc.
export const deleteCourse = async (course_id: number): Promise<void> => {
  await db('courses').where({ course_id }).delete();
};