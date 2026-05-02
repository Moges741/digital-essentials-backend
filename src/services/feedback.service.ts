import {
  createFeedback,
  findFeedbackByEnrollmentId,
  findFeedbackById,
  updateFeedback,
  deleteFeedback,
  listFeedbackByCourse,
} from '../models/feedback.model';
import { findEnrollmentById } from '../models/enrollment.model';
import { findCourseById } from '../models/course.model';
import {
  Feedback,
  FeedbackWithDetails,
  CreateFeedbackBody,
  UpdateFeedbackBody,
} from '../types/feedback.types';
import { JwtPayload } from '../types/auth.types';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../utils/errors';

// ─── Helper: verify enrollment ownership ───────
const verifyEnrollmentOwnership = async (
  enrollment_id: number,
  user: JwtPayload
): Promise<void> => {
  const enrollment = await findEnrollmentById(enrollment_id);
  if (!enrollment) throw new NotFoundError('Enrollment not found');

  if (user.role === 'learner' && enrollment.user_id !== user.user_id) {
    throw new ForbiddenError('You can only manage your own feedback');
  }
};

// ─── CREATE ───────────
export const createFeedbackService = async (
  enrollment_id: number,
  body: CreateFeedbackBody,
  user: JwtPayload
): Promise<Feedback> => {
  await verifyEnrollmentOwnership(enrollment_id, user);

  // Check if feedback already exists
  const existing = await findFeedbackByEnrollmentId(enrollment_id);
  if (existing) {
    throw new ConflictError('Feedback already submitted for this enrollment');
  }

  const feedback_id = await createFeedback({
    enrollment_id,
    rating: body.rating,
    comments: body.comments || null,
  });

  const feedback = await findFeedbackByEnrollmentId(enrollment_id);
  return feedback!;
};

// ─── GET BY ENROLLMENT ────────────────
export const getFeedbackService = async (
  enrollment_id: number,
  user: JwtPayload
): Promise<Feedback> => {
  await verifyEnrollmentOwnership(enrollment_id, user);

  const feedback = await findFeedbackByEnrollmentId(enrollment_id);
  if (!feedback) throw new NotFoundError('Feedback not found');

  return feedback;
};

// ─── UPDATE ───────────────────
export const updateFeedbackService = async (
  feedback_id: number,
  body: UpdateFeedbackBody,
  user: JwtPayload
): Promise<FeedbackWithDetails> => {
  const feedback = await findFeedbackById(feedback_id);
  if (!feedback) throw new NotFoundError('Feedback not found');

  await verifyEnrollmentOwnership(feedback.enrollment_id, user);

  await updateFeedback(feedback_id, {
    rating: body.rating,
    comments: body.comments,
  });

  const updated = await findFeedbackById(feedback_id);
  return updated!;
};

// ─── DELETE ──────────────────────
export const deleteFeedbackService = async (
  feedback_id: number,
  user: JwtPayload
): Promise<void> => {
  const feedback = await findFeedbackById(feedback_id);
  if (!feedback) throw new NotFoundError('Feedback not found');

  await verifyEnrollmentOwnership(feedback.enrollment_id, user);

  await deleteFeedback(feedback_id);
};

// ─── LIST BY COURSE (mentor view) ────────────────────────────
export const listFeedbackByCourseService = async (
  course_id: number,
  user: JwtPayload
): Promise<FeedbackWithDetails[]> => {
  const course = await findCourseById(course_id);
  if (!course) throw new NotFoundError('Course not found');

  const isAdmin = user.role === 'administrator';
  const isCreator = course.created_by === user.user_id;
  if (!isAdmin && !isCreator) {
    throw new ForbiddenError('You can only view feedback for your own courses');
  }

  return listFeedbackByCourse(course_id);
};