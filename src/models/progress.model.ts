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

// ─── Create progress row ───────────────────────────
export const createProgress = async (
  user_id: number,
  lesson_id: number,
  enrollment_id: number
): Promise<void> => {
  console.log(`[Progress] Creating progress record for user=${user_id}, lesson=${lesson_id}, enrollment=${enrollment_id}`);
  try {
    await db('progress').insert({
      user_id,
      lesson_id,
      enrollment_id,
      is_completed: false,
      synced_at: null,
    });
    console.log(`[Progress] Successfully created progress record`);
  } catch (error: any) {
    // If unique constraint violation (already exists), that's fine
    if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('UNIQUE')) {
      console.log(`[Progress] Progress record already exists`);
    } else {
      throw error;
    }
  }
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
  const rows = await db('lessons')
    .leftJoin('progress', function() {
      this.on('progress.lesson_id', 'lessons.lesson_id')
          .andOn('progress.user_id', db.raw('?', [user_id]));
    })
    .join('enrollments', function() {
      this.on('enrollments.course_id', 'lessons.course_id')
          .andOn('enrollments.user_id', db.raw('?', [user_id]));
    })
    .where('lessons.course_id', course_id)
    .select(
      db.raw('COALESCE(progress.user_id, ?) as user_id', [user_id]),
      'lessons.lesson_id',
      db.raw('COALESCE(progress.enrollment_id, enrollments.enrollment_id) as enrollment_id'),
      db.raw('COALESCE(progress.is_completed, false) as is_completed'),
      'progress.last_accessed',
      'progress.synced_at',
      'lessons.title as lesson_title',
      'lessons.lesson_order'
    )
    .orderBy('lessons.lesson_order', 'asc');

  // Normalize boolean values - databases return 0/1 instead of false/true
  return rows.map(row => ({
    ...row,
    is_completed: Boolean(row.is_completed) || row.is_completed === true,
  }));
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
  // is_completed is normalized to boolean in getCourseProgress
  const completed = lessons.filter((l) => l.is_completed === true).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  console.log(`[Progress Summary] User ${user_id}, Course ${course_id}: ${completed}/${total} lessons (${percentage}%)`);
  console.log(`[Progress Summary] Lessons breakdown:`, lessons.map(l => ({
    id: l.lesson_id,
    title: l.lesson_title,
    is_completed: l.is_completed,
    type: typeof l.is_completed
  })));

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