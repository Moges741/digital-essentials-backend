// src/models/exam.model.ts
// All database queries for the final exam feature

import db from '../config/db';
import {
  FinalExam,
  ExamQuestion,
  ExamWithQuestions,
  ExamAnswer,
  ExamAnswerWithQuestion,
  ExamResult,
  ExamSubmissionForMentor,
} from '../types/exam.types';

// ── EXAM (exercise with is_final_exam = true) ─────────────────

export const findExamByCourse = async (
  course_id: number
): Promise<FinalExam | undefined> => {
  return db('exercises')
    .where({ exam_course_id: course_id, is_final_exam: true })
    .first();
};

export const findExamWithQuestions = async (
  course_id: number
): Promise<ExamWithQuestions | undefined> => {
  const exam = await findExamByCourse(course_id);
  if (!exam) return undefined;

  const questions = await db('exam_questions')
    .where({ exercise_id: exam.exercise_id })
    .orderBy('question_order', 'asc');

  return { ...exam, questions };
};

export const createExam = async (data: {
  exam_course_id: number;
  title:          string;
  passing_score:  number;
  created_by:     number;
}): Promise<number> => {
  const [exercise_id] = await db('exercises').insert({
    lesson_id:      null,
    created_by:     data.created_by,
    title:          data.title,
    content_type:   'quiz',
    file_url:       null,
    cloudinary_public_id: null,
    is_downloadable: false,
    is_final_exam:  true,
    passing_score:  data.passing_score,
    exam_course_id: data.exam_course_id,
  });
  return exercise_id;
};

export const updateExam = async (
  exercise_id:   number,
  passing_score: number
): Promise<void> => {
  await db('exercises')
    .where({ exercise_id })
    .update({ passing_score });
};

export const deleteExam = async (exercise_id: number): Promise<void> => {
  await db('exercises').where({ exercise_id }).delete();
};

// ── QUESTIONS ─────────────────────────────────────────────────

export const findQuestion = async (
  question_id: number
): Promise<ExamQuestion | undefined> => {
  return db('exam_questions').where({ question_id }).first();
};

export const createQuestion = async (data: {
  exercise_id:    number;
  question_text:  string;
  question_type:  string;
  option_a?:      string | null;
  option_b?:      string | null;
  option_c?:      string | null;
  option_d?:      string | null;
  correct_answer?: string | null;
  question_order: number;
}): Promise<number> => {
  const [question_id] = await db('exam_questions').insert({
    exercise_id:    data.exercise_id,
    question_text:  data.question_text,
    question_type:  data.question_type,
    option_a:       data.option_a       ?? null,
    option_b:       data.option_b       ?? null,
    option_c:       data.option_c       ?? null,
    option_d:       data.option_d       ?? null,
    correct_answer: data.correct_answer ?? null,
    question_order: data.question_order,
  });
  return question_id;
};

export const updateQuestion = async (
  question_id: number,
  data:        Partial<ExamQuestion>
): Promise<void> => {
  await db('exam_questions').where({ question_id }).update(data);
};

export const deleteQuestion = async (
  question_id: number
): Promise<void> => {
  await db('exam_questions').where({ question_id }).delete();
};

export const countQuestions = async (
  exercise_id: number
): Promise<number> => {
  const [{ count }] = await db('exam_questions')
    .where({ exercise_id })
    .count('question_id as count');
  return Number(count);
};

// ── SUBMISSIONS & ANSWERS ─────────────────────────────────────

export const findExamSubmission = async (
  user_id:     number,
  exercise_id: number
): Promise<any | undefined> => {
  return db('exercise_submissions')
    .where({ user_id, exercise_id })
    .orderBy('submitted_at', 'desc')
    .first();
};

// Count how many times learner has submitted
export const countSubmissions = async (
  user_id:     number,
  exercise_id: number
): Promise<number> => {
  const [{ count }] = await db('exercise_submissions')
    .where({ user_id, exercise_id })
    .count('submission_id as count');
  return Number(count);
};

export const createSubmission = async (
  user_id:     number,
  exercise_id: number
): Promise<number> => {
  const [submission_id] = await db('exercise_submissions').insert({
    user_id,
    exercise_id,
    score:     null,   // calculated after grading
    is_synced: true,
  });
  return submission_id;
};

export const saveAnswer = async (data: {
  submission_id: number;
  question_id:   number;
  user_id:       number;
  answer_text:   string;
  is_correct:    boolean | null;
}): Promise<void> => {
  await db('exam_answers').insert(data);
};

export const findAnswersBySubmission = async (
  submission_id: number
): Promise<ExamAnswerWithQuestion[]> => {
  return db('exam_answers')
    .join(
      'exam_questions',
      'exam_answers.question_id',
      'exam_questions.question_id'
    )
    .where('exam_answers.submission_id', submission_id)
    .select(
      'exam_answers.*',
      'exam_questions.question_text',
      'exam_questions.question_type',
      'exam_questions.correct_answer',
      'exam_questions.option_a',
      'exam_questions.option_b',
      'exam_questions.option_c',
      'exam_questions.option_d'
    )
    .orderBy('exam_questions.question_order', 'asc');
};

export const findAnswer = async (
  answer_id: number
): Promise<ExamAnswer | undefined> => {
  return db('exam_answers').where({ answer_id }).first();
};

export const gradeAnswer = async (
  answer_id:  number,
  is_correct: boolean,
  graded_by:  number
): Promise<void> => {
  await db('exam_answers')
    .where({ answer_id })
    .update({
      is_correct,
      graded_by,
      graded_at: db.fn.now(),
    });
};

export const updateSubmissionScore = async (
  submission_id: number,
  score:         number
): Promise<void> => {
  await db('exercise_submissions')
    .where({ submission_id })
    .update({ score });
};

// Get all submissions for a course's exam (mentor view)
export const findAllSubmissionsForExam = async (
  exercise_id: number
): Promise<ExamSubmissionForMentor[]> => {
  const submissions = await db('exercise_submissions')
    .join('users', 'exercise_submissions.user_id', 'users.user_id')
    .where('exercise_submissions.exercise_id', exercise_id)
    .select(
      'exercise_submissions.*',
      'users.name  as learner_name',
      'users.email as learner_email'
    )
    .orderBy('exercise_submissions.submitted_at', 'desc');

  // For each submission calculate grading status
  return Promise.all(
    submissions.map(async (sub) => {
      const answers = await db('exam_answers')
        .where({ submission_id: sub.submission_id })
        .select('is_correct');

      const total   = answers.length;
      const graded  = answers.filter((a) => a.is_correct !== null).length;
      const correct = answers.filter((a) => a.is_correct === true).length;
      const pending = total - graded;

      const isFullyGraded = pending === 0 && total > 0;
      const score = isFullyGraded && total > 0
        ? Math.round((correct / total) * 100)
        : sub.score;

      return {
        submission_id:   sub.submission_id,
        user_id:         sub.user_id,
        learner_name:    sub.learner_name,
        learner_email:   sub.learner_email,
        score:           score ?? null,
        submitted_at:    sub.submitted_at,
        is_passed:       score !== null && score >= 70,
        is_fully_graded: isFullyGraded,
        pending_count:   pending,
      };
    })
  );
};

// Calculate score after all answers graded
export const calculateAndSaveScore = async (
  submission_id: number
): Promise<{ score: number; is_passed: boolean; passing_score: number }> => {

  const answers = await db('exam_answers')
    .where({ submission_id })
    .select('is_correct');

  const total   = answers.length;
  const correct = answers.filter((a) => a.is_correct === true).length;
  const score   = total > 0 ? Math.round((correct / total) * 100) : 0;

  await updateSubmissionScore(submission_id, score);

  // Get passing score from the exam
  const submission = await db('exercise_submissions')
    .where({ submission_id })
    .first();

  const exam = await db('exercises')
    .where({ exercise_id: submission.exercise_id })
    .first();

  const passing_score = exam?.passing_score ?? 70;

  return { score, is_passed: score >= passing_score, passing_score };
};