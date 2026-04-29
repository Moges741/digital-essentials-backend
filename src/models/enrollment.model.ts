import db from '../config/db';
import { Enrollment, EnrollmentWithCourse } from '../types/enrollment.types';

export const createEnrollment = async (
  user_id: number,
  course_id: number
): Promise<number> => {
  const [enrollment_id] = await db('enrollments').insert({
    user_id,
    course_id,
    status: 'active',
  });
  return enrollment_id;
};

export const findEnrollmentById = async (
  enrollment_id: number
): Promise<Enrollment | undefined> => {
  return db('enrollments')
    .where({ enrollment_id })
    .first();
};

export const findEnrollmentByUserAndCourse = async (
  user_id: number,
  course_id: number
): Promise<Enrollment | undefined> => {
  return db('enrollments')
    .where({ user_id, course_id })
    .first();
};

// ─── Get my enrollments with course details ───────────────────
export const getMyEnrollments = async (
  user_id: number
): Promise<EnrollmentWithCourse[]> => {
  return db('enrollments')
    .join('courses', 'enrollments.course_id', 'courses.course_id')
    .join('users', 'courses.created_by', 'users.user_id')
    .where('enrollments.user_id', user_id)
    .select(
      'enrollments.*',
      'courses.title as course_title',
      'courses.description as course_description',
      'users.name as creator_name',
      // Count total lessons in the course
      db.raw(`(
        SELECT COUNT(*) FROM lessons
        WHERE lessons.course_id = courses.course_id
      ) as total_lessons`),
      db.raw(`(
        SELECT COUNT(*) FROM progress
        WHERE progress.enrollment_id = enrollments.enrollment_id
        AND progress.is_completed = true
      ) as completed_lessons`)
    )
    .orderBy('enrollments.enrollment_date', 'desc');
};

// ─── Get enrollments for a course (mentor/admin view) ─────────
export const getCourseEnrollments = async (
  course_id: number
): Promise<any[]> => {
  return db('enrollments')
    .join('users', 'enrollments.user_id', 'users.user_id')
    .where('enrollments.course_id', course_id)
    .select(
      'enrollments.*',
      'users.name as learner_name',
      'users.email as learner_email'
    )
    .orderBy('enrollments.enrollment_date', 'desc');
};

// ─── Initialize progress for all lessons ─────────────────────
// Called right after enrollment is created
// Creates one progress row per lesson — all starting as incomplete
export const initializeProgress = async (
  user_id: number,
  course_id: number,
  enrollment_id: number
): Promise<void> => {
  const lessons = await db('lessons')
    .where({ course_id })
    .select('lesson_id');

  if (lessons.length === 0) return;

  const progressRows = lessons.map((lesson) => ({
    user_id,
    lesson_id:     lesson.lesson_id,
    enrollment_id,
    is_completed:  false,
    synced_at:     null,
  }));

  await db('progress').insert(progressRows);
};

// ─── Update enrollment status ─────────────────────────────────
export const updateEnrollmentStatus = async (
  enrollment_id: number,
  status: 'active' | 'completed' | 'dropped'
): Promise<void> => {
  await db('enrollments')
    .where({ enrollment_id })
    .update({ status });
};