import { Readable } from 'stream';
import cloudinary   from '../config/cloudinary';
import {
  createExercise,
  findExerciseById,
  listExercisesByCourse,
  updateExercise,
  deleteExercise,
  createSubmission,
  findSubmissionById,
  findSubmissionByUserAndExercise,
  getSubmissionsByExercise,
  getMySubmissionsByCourse,
} from '../models/exercise.model';
import { findCourseById }               from '../models/course.model';
import { findEnrollmentByUserAndCourse } from '../models/enrollment.model';
import {
  Exercise,
  ExerciseWithLesson,
  ExerciseSubmission,
  SubmissionWithLearner,
  CreateExerciseBody,
  SubmitExerciseBody,
} from '../types/exercise.types';
import { JwtPayload } from '../types/auth.types';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../utils/errors';

// ─── Helper: upload worksheet to Cloudinary ───────
const uploadWorksheetToCloudinary = (
  buffer: Buffer,
  course_id: number
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:        `digital-essentials/exercises/${course_id}`,
        resource_type: 'raw',
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id:  result.public_id,
        });
      }
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// ─── Helper: verify course ownership ───────
const verifyCourseOwnership = async (
  course_id: number,
  user: JwtPayload
): Promise<void> => {
  const course = await findCourseById(course_id);
  if (!course) throw new NotFoundError('Course not found');

  const isAdmin   = user.role === 'administrator';
  const isCreator = course.created_by === user.user_id;
  if (!isAdmin && !isCreator) {
    throw new ForbiddenError('You can only manage exercises in your own courses');
  }
};

// ─── CREATE ───────────
export const createExerciseService = async (
  course_id: number,
  body: CreateExerciseBody,
  user: JwtPayload,
  file?: Express.Multer.File
): Promise<ExerciseWithLesson> => {

  await verifyCourseOwnership(course_id, user);

  let file_url:             string | null = null;
  let cloudinary_public_id: string | null = null;

  // Upload worksheet file if provided
  if (file) {
    const result = await uploadWorksheetToCloudinary(file.buffer, course_id);
    file_url             = result.secure_url;
    cloudinary_public_id = result.public_id;
  }

  const exercise_id = await createExercise({
    lesson_id:            parseInt(body.lesson_id, 10),
    created_by:           user.user_id,
    title:                body.title,
    content_type:         body.content_type,
    file_url,
    cloudinary_public_id,
    is_downloadable:      body.is_downloadable === 'true',
  });

  const exercise = await findExerciseById(exercise_id);
  return exercise!;
};

// ─── LIST BY COURSE ────────────────
export const listExercisesService = async (
  course_id: number,
  user: JwtPayload
): Promise<ExerciseWithLesson[]> => {

  const course = await findCourseById(course_id);
  if (!course) throw new NotFoundError('Course not found');

  // Learner must be enrolled
  if (user.role === 'learner') {
    const enrollment = await findEnrollmentByUserAndCourse(
      user.user_id,
      course_id
    );
    if (!enrollment || enrollment.status === 'dropped') {
      throw new ForbiddenError('You must be enrolled to view exercises');
    }
  }

  return listExercisesByCourse(course_id);
};

// ─── GET ONE ───────────────────
export const getExerciseService = async (
  exercise_id: number,
  user: JwtPayload
): Promise<ExerciseWithLesson> => {

  const exercise = await findExerciseById(exercise_id);
  if (!exercise) throw new NotFoundError('Exercise not found');

  // Learner must be enrolled in the course
  if (user.role === 'learner') {
    const enrollment = await findEnrollmentByUserAndCourse(
      user.user_id,
      exercise.course_id
    );
    if (!enrollment || enrollment.status === 'dropped') {
      throw new ForbiddenError('You must be enrolled to view this exercise');
    }
  }

  return exercise;
};

// ─── DELETE ──────────────────────
export const deleteExerciseService = async (
  exercise_id: number,
  user: JwtPayload
): Promise<void> => {

  const exercise = await findExerciseById(exercise_id);
  if (!exercise) throw new NotFoundError('Exercise not found');

  await verifyCourseOwnership(exercise.course_id, user);

  // Delete from Cloudinary if file exists
  if (exercise.cloudinary_public_id) {
    await cloudinary.uploader.destroy(exercise.cloudinary_public_id, {
      resource_type: 'raw',
    });
  }

  await deleteExercise(exercise_id);
};

// ─── SUBMIT ─────────────────────
export const submitExerciseService = async (
  exercise_id: number,
  body: SubmitExerciseBody,
  user: JwtPayload
): Promise<ExerciseSubmission> => {

  const exercise = await findExerciseById(exercise_id);
  if (!exercise) throw new NotFoundError('Exercise not found');

  // Must be enrolled
  const enrollment = await findEnrollmentByUserAndCourse(
    user.user_id,
    exercise.course_id
  );
  if (!enrollment || enrollment.status === 'dropped') {
    throw new ForbiddenError('You must be enrolled to submit this exercise');
  }

  // Check not already submitted
  const existing = await findSubmissionByUserAndExercise(
    user.user_id,
    exercise_id
  );
  if (existing) {
    throw new ConflictError('You have already submitted this exercise');
  }

  const submission_id = await createSubmission({
    user_id:     user.user_id,
    exercise_id,
    score:       body.score ?? null,
  });

  const submission = await findSubmissionById(submission_id);
  return submission!;
};

// ─── GET SUBMISSIONS (mentor view) ────────────────────────────
export const getSubmissionsService = async (
  exercise_id: number,
  user: JwtPayload
): Promise<SubmissionWithLearner[]> => {

  const exercise = await findExerciseById(exercise_id);
  if (!exercise) throw new NotFoundError('Exercise not found');

  await verifyCourseOwnership(exercise.course_id, user);

  return getSubmissionsByExercise(exercise_id);
};

// ─── MY SUBMISSIONS FOR A COURSE ──────────────────────────────
export const getMySubmissionsService = async (
  course_id: number,
  user: JwtPayload
): Promise<any[]> => {

  const course = await findCourseById(course_id);
  if (!course) throw new NotFoundError('Course not found');

  return getMySubmissionsByCourse(user.user_id, course_id);
};