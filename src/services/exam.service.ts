
import {
  findExamByCourse,
  findExamWithQuestions,
  createExam,
  updateExam,
  deleteExam,
  findQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  countQuestions,
  findExamSubmission,
  createSubmission,
  saveAnswer,
  findAnswersBySubmission,
  findAnswer,
  gradeAnswer,
  calculateAndSaveScore,
  findAllSubmissionsForExam,
  countSubmissions,
} from '../models/exam.model';
import { findCourseById }               from '../models/course.model';
import { findEnrollmentByUserAndCourse } from '../models/enrollment.model';
import { updateEnrollmentStatus }        from '../models/enrollment.model';
import { generateCertificateService }    from './certificate.service';
import {
  FinalExam,
  ExamWithQuestions,
  ExamForLearner,
  ExamResult,
  ExamSubmissionForMentor,
  CreateExamBody,
  CreateQuestionBody,
  SubmitExamBody,
  GradeAnswerBody,
} from '../types/exam.types';
import { JwtPayload } from '../types/auth.types';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../utils/errors';

// ── Helper: verify course ownership ──────────────────────────
const verifyCourseOwnership = async (
  course_id: number,
  user:      JwtPayload
): Promise<void> => {
  const course = await findCourseById(course_id);
  if (!course) throw new NotFoundError('Course not found');
  const isAdmin   = user.role === 'administrator';
  const isCreator = course.created_by === user.user_id;
  if (!isAdmin && !isCreator) {
    throw new ForbiddenError(
      'You can only manage exams for your own courses'
    );
  }
};

// ── CREATE EXAM ───────────────────────────────────────────────
export const createExamService = async (
  course_id: number,
  body:      CreateExamBody,
  user:      JwtPayload
): Promise<FinalExam> => {

  await verifyCourseOwnership(course_id, user);

  // Only one final exam per course
  const existing = await findExamByCourse(course_id);
  if (existing) {
    throw new ConflictError(
      'This course already has a final exam. ' +
      'Delete the existing one first.'
    );
  }

  const exercise_id = await createExam({
    exam_course_id: course_id,
    title:          body.title,
    passing_score:  body.passing_score ?? 70,
    created_by:     user.user_id,
  });

  const exam = await findExamByCourse(course_id);
  return exam!;
};

// ── GET EXAM (mentor — full with correct answers) ─────────────
export const getExamForMentorService = async (
  course_id: number,
  user:      JwtPayload
): Promise<ExamWithQuestions> => {

  await verifyCourseOwnership(course_id, user);

  const exam = await findExamWithQuestions(course_id);
  if (!exam) throw new NotFoundError('No final exam found for this course');

  return exam;
};

// ── GET EXAM (learner — correct answers removed) ──────────────
export const getExamForLearnerService = async (
  course_id: number,
  user:      JwtPayload
): Promise<ExamForLearner> => {

  const exam = await findExamWithQuestions(course_id);
  if (!exam) throw new NotFoundError('No final exam found for this course');

  // Remove correct_answer from each question before sending
  const safeQuestions = exam.questions.map(
    ({ correct_answer, ...rest }) => rest
  );

  return { ...exam, questions: safeQuestions };
};

// ── UPDATE EXAM ───────────────────────────────────────────────
export const updateExamService = async (
  course_id:     number,
  passing_score: number,
  user:          JwtPayload
): Promise<FinalExam> => {

  await verifyCourseOwnership(course_id, user);

  const exam = await findExamByCourse(course_id);
  if (!exam) throw new NotFoundError('No final exam found for this course');

  await updateExam(exam.exercise_id, passing_score);

  const updated = await findExamByCourse(course_id);
  return updated!;
};

// ── DELETE EXAM ───────────────────────────────────────────────
export const deleteExamService = async (
  course_id: number,
  user:      JwtPayload
): Promise<void> => {

  await verifyCourseOwnership(course_id, user);

  const exam = await findExamByCourse(course_id);
  if (!exam) throw new NotFoundError('No final exam found for this course');

  await deleteExam(exam.exercise_id);
};

// ── ADD QUESTION ──────────────────────────────────────────────
export const addQuestionService = async (
  course_id: number,
  body:      CreateQuestionBody,
  user:      JwtPayload
): Promise<any> => {

  await verifyCourseOwnership(course_id, user);

  const exam = await findExamByCourse(course_id);
  if (!exam) throw new NotFoundError('Create the exam first before adding questions');

  // Validate multiple choice has all required fields
  if (body.question_type === 'multiple_choice') {
    if (!body.option_a || !body.option_b ||
        !body.option_c || !body.option_d) {
      throw new ValidationError(
        'Multiple choice questions require all four options (A, B, C, D)'
      );
    }
    if (!body.correct_answer ||
        !['A', 'B', 'C', 'D'].includes(body.correct_answer.toUpperCase())) {
      throw new ValidationError(
        'Multiple choice questions require a correct answer (A, B, C, or D)'
      );
    }
  }

  // Auto-assign order if not provided
  const total = await countQuestions(exam.exercise_id);
  const order = body.question_order ?? (total + 1);

  const question_id = await createQuestion({
    exercise_id:    exam.exercise_id,
    question_text:  body.question_text,
    question_type:  body.question_type,
    option_a:       body.option_a       ?? null,
    option_b:       body.option_b       ?? null,
    option_c:       body.option_c       ?? null,
    option_d:       body.option_d       ?? null,
    correct_answer: body.correct_answer
      ? body.correct_answer.toUpperCase()
      : null,
    question_order: order,
  });

  return findQuestion(question_id);
};

// ── UPDATE QUESTION ───────────────────────────────────────────
export const updateQuestionService = async (
  course_id:   number,
  question_id: number,
  body:        Partial<CreateQuestionBody>,
  user:        JwtPayload
): Promise<any> => {

  await verifyCourseOwnership(course_id, user);

  const question = await findQuestion(question_id);
  if (!question) throw new NotFoundError('Question not found');

  await updateQuestion(question_id, {
    ...body,
    correct_answer: body.correct_answer
      ? body.correct_answer.toUpperCase()
      : undefined,
  } as any);

  return findQuestion(question_id);
};

// ── DELETE QUESTION ───────────────────────────────────────────
export const deleteQuestionService = async (
  course_id:   number,
  question_id: number,
  user:        JwtPayload
): Promise<void> => {

  await verifyCourseOwnership(course_id, user);

  const question = await findQuestion(question_id);
  if (!question) throw new NotFoundError('Question not found');

  await deleteQuestion(question_id);
};

// ── SUBMIT EXAM ───────────────────────────────────────────────
export const submitExamService = async (
  course_id: number,
  body:      SubmitExamBody,
  user:      JwtPayload
): Promise<ExamResult> => {

  // 1. Check enrollment exists and is exam_pending or active
  const enrollment = await findEnrollmentByUserAndCourse(
    user.user_id,
    course_id
  );

  if (!enrollment || enrollment.status === 'dropped') {
    throw new ForbiddenError('You are not enrolled in this course');
  }

  if (enrollment.status === 'completed') {
    throw new ValidationError(
      'You have already completed this course and received a certificate'
    );
  }

  // 2. Get exam and questions
  const exam = await findExamWithQuestions(course_id);
  if (!exam) throw new NotFoundError('No final exam found for this course');

  // 3. Validate all questions answered
  const questionIds = exam.questions.map((q) => q.question_id);
  const answeredIds = body.answers.map((a) => a.question_id);
  const missing     = questionIds.filter(
    (id) => !answeredIds.includes(id)
  );

  if (missing.length > 0) {
    throw new ValidationError(
      `Please answer all questions. Missing: ${missing.length} question(s)`
    );
  }

  // 4. Create submission record
  const submission_id = await createSubmission(
    user.user_id,
    exam.exercise_id
  );

  // 5. Save each answer
  // Auto-grade multiple choice, leave short answer as null
  for (const answer of body.answers) {
    const question = exam.questions.find(
      (q) => q.question_id === answer.question_id
    );
    if (!question) continue;

    let is_correct: boolean | null = null;

    if (question.question_type === 'multiple_choice') {
      // Auto-grade: compare learner answer to correct answer
      is_correct =
        answer.answer_text.toUpperCase() ===
        question.correct_answer?.toUpperCase();
    }
    // short_answer → is_correct stays null (pending mentor review)

    await saveAnswer({
      submission_id,
      question_id:  answer.question_id,
      user_id:      user.user_id,
      answer_text:  answer.answer_text,
      is_correct,
    });
  }

  // 6. If all questions are multiple choice → calculate score immediately
  const allMultipleChoice = exam.questions.every(
    (q) => q.question_type === 'multiple_choice'
  );

  if (allMultipleChoice) {
    const { score, is_passed, passing_score } =
      await calculateAndSaveScore(submission_id);

    if (is_passed) {
      // All lessons already done + exam passed → complete enrollment
      await updateEnrollmentStatus(enrollment.enrollment_id, 'completed');
      // Generate certificate
      await generateCertificateService(user.user_id, course_id);
    }
  }
  // If has short answers → status stays exam_pending
  // Mentor must grade → then certificate generated

  // 7. Return result
  const answers = await findAnswersBySubmission(submission_id);
  const submissionRecord = await import('../config/db').then(
    (m) => m.default('exercise_submissions')
      .where({ submission_id })
      .first()
  );

  const total   = answers.length;
  const graded  = answers.filter((a) => a.is_correct !== null).length;
  const correct = answers.filter((a) => a.is_correct === true).length;
  const pending = total - graded;

  const isFullyGraded = pending === 0;
  const score = isFullyGraded
    ? Math.round((correct / total) * 100)
    : null;

  return {
    submission_id,
    user_id:         user.user_id,
    exercise_id:     exam.exercise_id,
    score,
    submitted_at:    submissionRecord.submitted_at,
    is_passed:       score !== null && score >= exam.passing_score,
    is_fully_graded: isFullyGraded,
    answers,
  };
};

// ── GET MY EXAM RESULT ────────────────────────────────────────
export const getExamResultService = async (
  course_id: number,
  user:      JwtPayload
): Promise<ExamResult | null> => {

  const exam = await findExamByCourse(course_id);
  if (!exam) throw new NotFoundError('No final exam for this course');

  const submission = await findExamSubmission(
    user.user_id,
    exam.exercise_id
  );

  if (!submission) return null;  // not submitted yet

  const answers   = await findAnswersBySubmission(submission.submission_id);
  const total     = answers.length;
  const graded    = answers.filter((a) => a.is_correct !== null).length;
  const correct   = answers.filter((a) => a.is_correct === true).length;
  const pending   = total - graded;
  const isFullyGraded = pending === 0 && total > 0;
  const score     = isFullyGraded
    ? Math.round((correct / total) * 100)
    : submission.score;

  return {
    submission_id:   submission.submission_id,
    user_id:         user.user_id,
    exercise_id:     exam.exercise_id,
    score,
    submitted_at:    submission.submitted_at,
    is_passed:       score !== null && score >= exam.passing_score,
    is_fully_graded: isFullyGraded,
    answers,
  };
};

// ── GET ALL SUBMISSIONS (mentor) ──────────────────────────────
export const getExamSubmissionsService = async (
  course_id: number,
  user:      JwtPayload
): Promise<ExamSubmissionForMentor[]> => {

  await verifyCourseOwnership(course_id, user);

  const exam = await findExamByCourse(course_id);
  if (!exam) throw new NotFoundError('No final exam for this course');

  return findAllSubmissionsForExam(exam.exercise_id);
};

// ── GRADE SHORT ANSWER ────────────────────────────────────────
export const gradeAnswerService = async (
  answer_id:  number,
  body:       GradeAnswerBody,
  user:       JwtPayload
): Promise<void> => {

  const answer = await findAnswer(answer_id);
  if (!answer) throw new NotFoundError('Answer not found');

  // Grade it
  await gradeAnswer(answer_id, body.is_correct, user.user_id);

  // Check if all answers in this submission are now graded
  const allAnswers = await findAnswersBySubmission(answer.submission_id);
  const stillPending = allAnswers.filter(
    (a) => a.is_correct === null
  ).length;

  if (stillPending === 0) {
    // All graded — calculate final score
    const { score, is_passed, passing_score } =
      await calculateAndSaveScore(answer.submission_id);

    // Get enrollment for this learner + course
    const submission = await import('../config/db').then(
      (m) => m.default('exercise_submissions')
        .where({ submission_id: answer.submission_id })
        .first()
    );

    const exam = await import('../config/db').then(
      (m) => m.default('exercises')
        .where({ exercise_id: submission.exercise_id })
        .first()
    );

    const enrollment = await findEnrollmentByUserAndCourse(
      answer.user_id,
      exam.exam_course_id
    );

    if (enrollment && is_passed) {
      await updateEnrollmentStatus(
        enrollment.enrollment_id,
        'completed'
      );
      await generateCertificateService(
        answer.user_id,
        exam.exam_course_id
      );
    }
  }
};