import db from '../config/db';
import { Feedback, FeedbackWithDetails } from '../types/feedback.types';

// ─── Create feedback ───────────
export const createFeedback = async (data: {
  enrollment_id: number;
  rating:        number;
  comments:      string | null;
}): Promise<number> => {
  const [feedback_id] = await db('feedback').insert({
    ...data,
    submitted_at: new Date(),
  });
  return feedback_id;
};

// ─── Find feedback by enrollment ID ─────────
export const findFeedbackByEnrollmentId = async (
  enrollment_id: number
): Promise<Feedback | undefined> => {
  return db('feedback')
    .where({ enrollment_id })
    .first();
};

// ─── Find feedback by ID ─────────
export const findFeedbackById = async (
  feedback_id: number
): Promise<FeedbackWithDetails | undefined> => {
  return db('feedback')
    .join('enrollments', 'feedback.enrollment_id', 'enrollments.enrollment_id')
    .join('users', 'enrollments.user_id', 'users.user_id')
    .join('courses', 'enrollments.course_id', 'courses.course_id')
    .where('feedback.feedback_id', feedback_id)
    .select(
      'feedback.*',
      'courses.title as course_title',
      'users.name as user_name',
      'users.email as user_email'
    )
    .first();
};

// ─── Update feedback ───────────
export const updateFeedback = async (
  feedback_id: number,
  data: Partial<{
    rating:   number;
    comments: string;
  }>
): Promise<void> => {
  await db('feedback')
    .where({ feedback_id })
    .update(data);
};

// ─── Delete feedback ───────────
export const deleteFeedback = async (feedback_id: number): Promise<void> => {
  await db('feedback')
    .where({ feedback_id })
    .delete();
};

// ─── List feedback for a course (mentor view) ─────────
export const listFeedbackByCourse = async (
  course_id: number
): Promise<FeedbackWithDetails[]> => {
  return db('feedback')
    .join('enrollments', 'feedback.enrollment_id', 'enrollments.enrollment_id')
    .join('users', 'enrollments.user_id', 'users.user_id')
    .join('courses', 'enrollments.course_id', 'courses.course_id')
    .where('enrollments.course_id', course_id)
    .select(
      'feedback.*',
      'courses.title as course_title',
      'users.name as user_name',
      'users.email as user_email'
    )
    .orderBy('feedback.submitted_at', 'desc');
};