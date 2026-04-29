import {
  createEnrollment,
  findEnrollmentById,
  findEnrollmentByUserAndCourse,
  getMyEnrollments,
  getCourseEnrollments,
  initializeProgress,
  updateEnrollmentStatus,
} from '../models/enrollment.model';
import { findCourseById } from '../models/course.model';
import {
  Enrollment,
  EnrollmentWithCourse,
  CreateEnrollmentBody,
} from '../types/enrollment.types';
import { JwtPayload } from '../types/auth.types';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../utils/errors';

// ─── ENROLL ───────────────────────────────────────────────────
export const enrollService = async (
  body: CreateEnrollmentBody,
  user: JwtPayload
): Promise<Enrollment> => {

  const { course_id } = body;

  // 1. Check course exists
  const course = await findCourseById(course_id);
  if (!course) {
    throw new NotFoundError('Course not found');
  }

  // 2. Course must be published to enroll
  if (!course.is_published) {
    throw new ValidationError('Cannot enroll in an unpublished course');
  }

  // 3. Check not already enrolled
  const existing = await findEnrollmentByUserAndCourse(user.user_id, course_id);
  if (existing) {
    // If previously dropped, allow re-enrollment
    if (existing.status === 'dropped') {
      await updateEnrollmentStatus(existing.enrollment_id, 'active');
      return existing;
    }
    throw new ConflictError('You are already enrolled in this course');
  }

  // 4. Create enrollment
  const enrollment_id = await createEnrollment(user.user_id, course_id);

  // 5. Initialize progress for all existing lessons
  await initializeProgress(user.user_id, course_id, enrollment_id);

  const enrollment = await findEnrollmentById(enrollment_id);
  return enrollment!;
};

// ─── MY ENROLLMENTS ───────────────────────────────────────────
export const getMyEnrollmentsService = async (
  user: JwtPayload
): Promise<EnrollmentWithCourse[]> => {
  return getMyEnrollments(user.user_id);
};

// ─── COURSE ENROLLMENTS (mentor/admin) ────────────────────────
export const getCourseEnrollmentsService = async (
  course_id: number,
  user: JwtPayload
): Promise<any[]> => {

  const course = await findCourseById(course_id);
  if (!course) {
    throw new NotFoundError('Course not found');
  }

  // Mentor can only see enrollments for their own course
  const isAdmin   = user.role === 'administrator';
  const isCreator = course.created_by === user.user_id;

  if (!isAdmin && !isCreator) {
    throw new ForbiddenError('You can only view enrollments for your own courses');
  }

  return getCourseEnrollments(course_id);
};

// ─── DROP ENROLLMENT ──────────────────────────────────────────
export const dropEnrollmentService = async (
  enrollment_id: number,
  user: JwtPayload
): Promise<void> => {

  const enrollment = await findEnrollmentById(enrollment_id);

  if (!enrollment) {
    throw new NotFoundError('Enrollment not found');
  }

  // Learner can only drop their own enrollment
  const isAdmin = user.role === 'administrator';
  const isOwner = enrollment.user_id === user.user_id;

  if (!isAdmin && !isOwner) {
    throw new ForbiddenError('You can only drop your own enrollments');
  }

  if (enrollment.status === 'dropped') {
    throw new ValidationError('Enrollment is already dropped');
  }

  await updateEnrollmentStatus(enrollment_id, 'dropped');
};