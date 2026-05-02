import db from '../config/db';
import {
  Exercise,
  ExerciseWithLesson,
  ExerciseSubmission,
  SubmissionWithLearner,
} from '../types/exercise.types';

// ─── Create exercise ───────────
export const createExercise = async (data: {
  lesson_id:            number;
  created_by:           number;
  title:                string;
  content_type:         string;
  file_url:             string | null;
  cloudinary_public_id: string | null;
  is_downloadable:      boolean;
}): Promise<number> => {
  const [exercise_id] = await db('exercises').insert(data);
  return exercise_id;
};

// ─── Find exercise by ID ─────────
export const findExerciseById = async (
  exercise_id: number
): Promise<ExerciseWithLesson | undefined> => {
  return db('exercises')
    .join('lessons', 'exercises.lesson_id', 'lessons.lesson_id')
    .where('exercises.exercise_id', exercise_id)
    .select(
      'exercises.*',
      'lessons.title as lesson_title',
      'lessons.lesson_order',
      'lessons.course_id'
    )
    .first();
};

// ─── List exercises by course ──────
export const listExercisesByCourse = async (
  course_id: number
): Promise<ExerciseWithLesson[]> => {
  return db('exercises')
    .join('lessons', 'exercises.lesson_id', 'lessons.lesson_id')
    .where('lessons.course_id', course_id)
    .select(
      'exercises.*',
      'lessons.title as lesson_title',
      'lessons.lesson_order',
      'lessons.course_id'
    )
    .orderBy('lessons.lesson_order', 'asc');
};

// ─── List exercises by lesson ─────────────────────────────────
export const listExercisesByLesson = async (
  lesson_id: number
): Promise<Exercise[]> => {
  return db('exercises')
    .where({ lesson_id })
    .orderBy('created_at', 'asc');
};

// ─── Update exercise ──────────────────────────────────────────
export const updateExercise = async (
  exercise_id: number,
  data: Partial<{
    title:            string;
    content_type:     string;
    file_url:         string;
    cloudinary_public_id: string;
    is_downloadable:  boolean;
  }>
): Promise<void> => {
  await db('exercises')
    .where({ exercise_id })
    .update(data);
};

// ─── Delete exercise ──────────────────────────────────────────
export const deleteExercise = async (exercise_id: number): Promise<void> => {
  await db('exercises')
    .where({ exercise_id })
    .delete();
};

// ─── Create submission ────────────────────────────────────────
export const createSubmission = async (data: {
  user_id:     number;
  exercise_id: number;
  score:       number | null;
}): Promise<number> => {
  const [submission_id] = await db('exercise_submissions').insert({
    ...data,
    is_synced: true,  // submitted online = already synced
  });
  return submission_id;
};

// ─── Find submission by ID ────────────────────────────────────
export const findSubmissionById = async (
  submission_id: number
): Promise<ExerciseSubmission | undefined> => {
  return db('exercise_submissions')
    .where({ submission_id })
    .first();
};

// ─── Find submission by user and exercise ─────────────────────
export const findSubmissionByUserAndExercise = async (
  user_id: number,
  exercise_id: number
): Promise<ExerciseSubmission | undefined> => {
  return db('exercise_submissions')
    .where({ user_id, exercise_id })
    .first();
};

// ─── Get all submissions for an exercise (mentor view) ────────
export const getSubmissionsByExercise = async (
  exercise_id: number
): Promise<SubmissionWithLearner[]> => {
  return db('exercise_submissions')
    .join('users', 'exercise_submissions.user_id', 'users.user_id')
    .where('exercise_submissions.exercise_id', exercise_id)
    .select(
      'exercise_submissions.*',
      'users.name as learner_name',
      'users.email as learner_email'
    )
    .orderBy('exercise_submissions.submitted_at', 'desc');
};

// ─── Get my submissions for a course ─────────────────────────
export const getMySubmissionsByCourse = async (
  user_id: number,
  course_id: number
): Promise<any[]> => {
  return db('exercise_submissions')
    .join('exercises', 'exercise_submissions.exercise_id', 'exercises.exercise_id')
    .join('lessons',   'exercises.lesson_id',              'lessons.lesson_id')
    .where('exercise_submissions.user_id', user_id)
    .where('lessons.course_id', course_id)
    .select(
      'exercise_submissions.*',
      'exercises.title as exercise_title',
      'exercises.content_type',
      'lessons.title as lesson_title'
    )
    .orderBy('exercise_submissions.submitted_at', 'desc');
};