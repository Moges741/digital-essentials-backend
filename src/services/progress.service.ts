import {
  findProgress,
  markLessonComplete,
  markLessonCompleteOffline,
  allLessonsComplete,
  getProgressSummary,
} from '../models/progress.model';
import {
  findEnrollmentByUserAndCourse,
  updateEnrollmentStatus,
} from '../models/enrollment.model';
import { findCourseById }  from '../models/course.model';
import { findLessonById }  from '../models/lesson.model';
import {
  CourseProgressSummary,
  SyncProgressBody,
  SyncResult,
} from '../types/progress.types';
import { JwtPayload }   from '../types/auth.types';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../utils/errors';

// ─── MARK LESSON COMPLETE (online) ──────────────────
export const markCompleteService = async (
  lesson_id: number,
  user: JwtPayload
): Promise<void> => {

  // 1. Lesson must exist
  const lesson = await findLessonById(lesson_id);
  if (!lesson) {
    throw new NotFoundError('Lesson not found');
  }
  // 2. Learner must be enrolled in the course
  const enrollment = await findEnrollmentByUserAndCourse(
    user.user_id,
    lesson.course_id
  );

  if (!enrollment || enrollment.status === 'dropped') {
    throw new ForbiddenError('You are not enrolled in this course');
  }

  // 3. Find progress row — created at enrollment time
  const progress = await findProgress(user.user_id, lesson_id);
  if (!progress) {
    throw new NotFoundError('Progress record not found');
  }

  // 4. Already completed — no need to update
  if (progress.is_completed) {
    throw new ValidationError('Lesson already marked as complete');
  }

  // 5. Mark complete
  await markLessonComplete(user.user_id, lesson_id);

  // 6. Check if ALL lessons in enrollment are now complete
  const allDone = await allLessonsComplete(enrollment.enrollment_id);
  if (allDone) {
    await updateEnrollmentStatus(enrollment.enrollment_id, 'completed');
  }
};

// ─── SYNC OFFLINE PROGRESS ────────────────────────────────────
// This is the core offline feature from your document
// Sequence Diagram 6 — learner completes lessons offline
// then sends batch sync when internet is available
export const syncOfflineProgressService = async (
  body: SyncProgressBody,
  user: JwtPayload
): Promise<SyncResult> => {

  const result: SyncResult = { synced: [], failed: [] };

  for (const item of body.completions) {
    try {
      // Validate lesson exists
      const lesson = await findLessonById(item.lesson_id);
      if (!lesson) {
        result.failed.push({
          lesson_id: item.lesson_id,
          reason:    'Lesson not found',
        });
        continue;
      }

      // Validate enrollment exists
      const enrollment = await findEnrollmentByUserAndCourse(
        user.user_id,
        lesson.course_id
      );

      if (!enrollment || enrollment.status === 'dropped') {
        result.failed.push({
          lesson_id: item.lesson_id,
          reason:    'Not enrolled in this course',
        });
        continue;
      }

      // Find progress row
      const progress = await findProgress(user.user_id, item.lesson_id);
      if (!progress) {
        result.failed.push({
          lesson_id: item.lesson_id,
          reason:    'Progress record not found',
        });
        continue;
      }

      // Mark complete with device timestamp
      await markLessonCompleteOffline(
        user.user_id,
        item.lesson_id,
        item.completed_at
      );

      // Check course completion after each sync
      const allDone = await allLessonsComplete(enrollment.enrollment_id);
      if (allDone) {
        await updateEnrollmentStatus(enrollment.enrollment_id, 'completed');
      }

      result.synced.push(item.lesson_id);

    } catch {
      result.failed.push({
        lesson_id: item.lesson_id,
        reason:    'Unexpected error during sync',
      });
    }
  }

  return result;
};

// ─── GET COURSE PROGRESS ──────────────────────────────────────
export const getCourseProgressService = async (
  course_id: number,
  user: JwtPayload
): Promise<CourseProgressSummary> => {

  const summary = await getProgressSummary(user.user_id, course_id);

  if (!summary) {
    throw new NotFoundError('You are not enrolled in this course');
  }

  return summary;
};

// ─── GET COURSE PROGRESS (mentor/admin view) ──────────────────
export const getCourseProgressAdminService = async (
  course_id: number,
  target_user_id: number,
  requester: JwtPayload
): Promise<CourseProgressSummary> => {

  const course = await findCourseById(course_id);
  if (!course) throw new NotFoundError('Course not found');

  const isAdmin   = requester.role === 'administrator';
  const isCreator = course.created_by === requester.user_id;

  if (!isAdmin && !isCreator) {
    throw new ForbiddenError('You can only view progress for your own courses');
  }

  const summary = await getProgressSummary(target_user_id, course_id);
  if (!summary) {
    throw new NotFoundError('This user is not enrolled in this course');
  }

  return summary;
};