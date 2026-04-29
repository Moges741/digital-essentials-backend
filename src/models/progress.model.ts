import db from '../config/db';
import { Progress, ProgressWithLesson, CourseProgressSummary } from '../types/progress.types';

// ─── Find progress row ────────────────────────────
export const findProgress = async (
  user_id: number,
  lesson_id: number
): Promise<Progress | undefined> => {
  return db('progress')
    .where({ user_id, lesson_id })
    .first();
};

// ─── Mark lesson complete ─────────────────────────────────────
export const markLessonComplete = async (
  user_id: number,
  lesson_id: number
): Promise<void> => {
  await db('progress')
    .where({ user_id, lesson_id })
    .update({
      is_completed:  true,
      last_accessed: db.fn.now(),
      synced_at:     db.fn.now(),  // online = synced immediately
    });
};

// ─── Mark lesson complete from offline sync ───────────
export const markLessonCompleteOffline = async (
  user_id: number,
  lesson_id: number,
  completed_at: string
): Promise<void> => {
  await db('progress')
    .where({ user_id, lesson_id })
    .update({
      is_completed:  true,
      last_accessed: new Date(completed_at),
      synced_at:     db.fn.now(),  // synced NOW when internet returned
    });
};

// ─── Get course progress for a user ──────────────────────────
export const getCourseProgress = async (
  user_id: number,
  course_id: number
): Promise<ProgressWithLesson[]> => {
  return db('progress')
    .join('lessons', 'progress.lesson_id', 'lessons.lesson_id')
    .join('enrollments', 'progress.enrollment_id', 'enrollments.enrollment_id')
    .where('progress.user_id', user_id)
    .where('enrollments.course_id', course_id)
    .select(
      'progress.*',
      'lessons.title as lesson_title',
      'lessons.lesson_order'
    )
    .orderBy('lessons.lesson_order', 'asc');
};

// ─── Check if all lessons complete ────────────────
export const allLessonsComplete = async (
  enrollment_id: number
): Promise<boolean> => {
  const result = await db('progress')
    .where({ enrollment_id })
    .select(
      db.raw('COUNT(*) as total'),
      db.raw('SUM(CASE WHEN is_completed = true THEN 1 ELSE 0 END) as completed')
    )
    .first();

  const total     = Number(result?.total)     || 0;
  const completed = Number(result?.completed) || 0;

  // No lessons = not complete
  if (total === 0) return false;

  return total === completed;
};

// ─── Get progress summary for a course ───────────────────────
export const getProgressSummary = async (
  user_id: number,
  course_id: number
): Promise<CourseProgressSummary | undefined> => {

  const enrollment = await db('enrollments')
    .join('courses', 'enrollments.course_id', 'courses.course_id')
    .where('enrollments.user_id', user_id)
    .where('enrollments.course_id', course_id)
    .select(
      'enrollments.enrollment_id',
      'enrollments.status',
      'courses.course_id',
      'courses.title as course_title'
    )
    .first();

  if (!enrollment) return undefined;

  const lessons = await getCourseProgress(user_id, course_id);

  const total     = lessons.length;
  const completed = lessons.filter((l) => l.is_completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    enrollment_id:     enrollment.enrollment_id,
    course_id:         enrollment.course_id,
    course_title:      enrollment.course_title,
    status:            enrollment.status,
    total_lessons:     total,
    completed_lessons: completed,
    percentage,
    lessons,
  };
};