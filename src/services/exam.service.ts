
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
import db from '../config/db';
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
  ExamAnswerWithQuestion,
  CreateExamBody,
  CreateQuestionBody,
  SubmitExamBody,
  GradeAnswerBody,
  GradeAnswerResponse,
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
    console.log(`[Create Exam] Exam already exists for course ${course_id}: ${existing.title}`);
    throw new ConflictError(
      'An exam already exists for this course. Delete it from the exam builder to create a new one.'
    );
  }

  const exercise_id = await createExam({
    exam_course_id: course_id,
    title:          body.title,
    passing_score:  body.passing_score ?? 70,
    created_by:     user.user_id,
  });

  console.log(`[Create Exam] Created exercise #${exercise_id} for course #${course_id}`);
  console.log(`[Create Exam] Title: ${body.title}, Passing Score: ${body.passing_score ?? 70}%`);

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

  // Verify learner is enrolled and eligible for exam
  const enrollment = await findEnrollmentByUserAndCourse(user.user_id, course_id);
  if (!enrollment || enrollment.status !== 'exam_pending') {
    throw new ForbiddenError('You are not eligible to take this exam');
  }

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

  console.log(`[Update Exam] Updated passing_score to ${passing_score}% for exam #${exam.exercise_id}`);

  const updated = await findExamByCourse(course_id);
  return updated!;
};

// ── DELETE EXAM ───────────────────────────────────────────────
export const deleteExamService = async (
  course_id: number,
  user:      JwtPayload
): Promise<void> => {

  console.log(`[Delete Exam] Course ${course_id}, User ${user.user_id}`);
  await verifyCourseOwnership(course_id, user);

  const exam = await findExamByCourse(course_id);
  if (!exam) {
    console.log(`[Delete Exam] No exam found for course ${course_id}`);
    throw new NotFoundError('No final exam found for this course');
  }

  console.log(`[Delete Exam] Found exam: exercise_id=${exam.exercise_id}, title=${exam.title}`);
  
  try {
    await deleteExam(exam.exercise_id);
    console.log(`[Delete Exam] Deleted exercise #${exam.exercise_id}`);
  } catch (error) {
    console.error(`[Delete Exam] Error deleting exercise #${exam.exercise_id}:`, error);
    throw error;
  }
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

  console.log(`[Add Question] Added Q#${question_id} to exam #${exam.exercise_id}`);
  console.log(`[Add Question] Type: ${body.question_type}, Order: ${order}`);

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

  console.log(`[Update Question] Updated Q#${question_id}: ${JSON.stringify(body)}`);

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

  console.log(`[Delete Question] Removed Q#${question_id} from exam #${question.exercise_id}`);
};

// ── SUBMIT EXAM ───────────────────────────────────────────────
export const submitExamService = async (
  course_id: number,
  body:      SubmitExamBody,
  user:      JwtPayload
): Promise<ExamResult> => {

  // 1. Check enrollment exists and is exam_pending
  const enrollment = await findEnrollmentByUserAndCourse(
    user.user_id,
    course_id
  );

  if (!enrollment || enrollment.status !== 'exam_pending') {
    throw new ForbiddenError('You are not eligible to submit this exam');
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
    console.log(`[Submit Exam] Validation failed. Missing: ${missing.length} question(s)`);
    throw new ValidationError(
      `Please answer all questions. Missing: ${missing.length} question(s)`
    );
  }

  // 4. Create submission record
  const submission_id = await createSubmission(
    user.user_id,
    exam.exercise_id
  );
  console.log(`[Submit Exam] Created submission #${submission_id} for learner #${user.user_id}`);

  // 5. Save each answer
  // Auto-grade multiple choice, leave short answer as null
  for (const answer of body.answers) {
    const question = exam.questions.find(
      (q) => q.question_id === answer.question_id
    );
    if (!question) continue;

    let is_correct: boolean | null = null;

    if (question.question_type === 'multiple_choice') {
      // Auto-grade: compare learner answer to correct answer (case-insensitive)
      is_correct =
        answer.answer_text.toUpperCase() ===
        question.correct_answer?.toUpperCase();
      console.log(`[Submit Exam - MC] Q#${question.question_id}: Learner answered '${answer.answer_text}', Correct answer: '${question.correct_answer}', is_correct=${is_correct}`);
    } else {
      // short_answer → is_correct stays null (pending mentor review)
      console.log(`[Submit Exam - Short] Q#${question.question_id}: Saved answer for mentor review, answer_text=${answer.answer_text}`);
    }

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
    console.log(`[Submit Exam] All MC exam detected. Proceeding to score calculation.`);

    const { score, is_passed, passing_score } =
      await calculateAndSaveScore(submission_id);

    console.log(`[Submit Exam - Score] Submission #${submission_id}:`);
    console.log(`  Score: ${score}%`);
    console.log(`  Passing Score: ${passing_score}%`);
    console.log(`  Is Passed: ${is_passed}`);

    if (is_passed) {
      // All lessons already done + exam passed → complete enrollment
      await updateEnrollmentStatus(enrollment.enrollment_id, 'completed');
      console.log(`[Submit Exam] PASSED! Updating enrollment to 'completed'. Certificate generated.`);
      await generateCertificateService(user.user_id, course_id);
    } else {
      console.log(`[Submit Exam] FAILED! Score ${score}% < ${passing_score}%. Enrollment remains exam_pending for retake.`);
    }
  } else {
    console.log(`[Submit Exam] Exam has short answer questions. Keeping enrollment in exam_pending. Awaiting mentor grading.`);
  }

  // 7. Return result
  const answers = await findAnswersBySubmission(submission_id);
  const submissionRecord = await db('exercise_submissions')
    .where({ submission_id })
    .first();

  const total   = answers.length;
  const pending = answers.filter((a) => a.is_correct === null).length;
  const correct = answers.filter((a: any) => a.is_correct === true || a.is_correct === 1).length;

  const isFullyGraded = pending === 0 && total > 0;
  const score = isFullyGraded
    ? Math.round((correct / total) * 100)
    : null;

  // Strip correct_answer from learner response
  const safeAnswers = answers.map(({ correct_answer, option_a, option_b, option_c, option_d, ...rest }) => ({
    ...rest,
  }));

  return {
    submission_id,
    user_id:         user.user_id,
    exercise_id:     exam.exercise_id,
    score,
    submitted_at:    submissionRecord.submitted_at,
    is_passed:       score !== null ? score >= exam.passing_score : null,
    is_fully_graded: isFullyGraded,
    answers:         safeAnswers as ExamAnswerWithQuestion[],
  };
};

// ── GET MY EXAM RESULT ────────────────────────────────────────
export const getExamResultService = async (
  course_id: number,
  user:      JwtPayload
): Promise<ExamResult | null> => {

  console.log(`[Get Exam Result] User #${user.user_id} fetching result for course #${course_id}`);

  // Verify user is enrolled in the course
  const enrollment = await findEnrollmentByUserAndCourse(user.user_id, course_id);
  if (!enrollment || enrollment.status === 'dropped') {
    throw new ForbiddenError('You are not enrolled in this course');
  }

  const exam = await findExamByCourse(course_id);
  if (!exam) throw new NotFoundError('No final exam for this course');

  const submission = await findExamSubmission(
    user.user_id,
    exam.exercise_id
  );

  if (!submission) {
    console.log(`[Get Exam Result] No submission found`);
    return null;  // not submitted yet
  }

  console.log(`[Get Exam Result] Latest submission: #${submission.submission_id}`);

  const answers   = await findAnswersBySubmission(submission.submission_id);

  const total     = answers.length;
  const pending   = answers.filter((a: any) => a.is_correct === null).length;
  const graded    = total - pending;
  const correct   = answers.filter((a: any) => a.is_correct === true || a.is_correct === 1).length;
  const isFullyGraded = pending === 0 && total > 0;
  const score     = isFullyGraded
    ? Math.round((correct / total) * 100)
    : submission.score;

  const is_passed = score !== null && score !== undefined
    ? score >= exam.passing_score
    : null;

  console.log(`[Get Exam Result] Total Questions: ${total}`);
  console.log(`[Get Exam Result] Graded: ${graded}, Correct: ${correct}`);
  console.log(`[Get Exam Result] Pending: ${pending}`);
  console.log(`[Get Exam Result] Score: ${score}%, Is Fully Graded: ${isFullyGraded}`);
  console.log(`[Get Exam Result] Is Passed: ${is_passed}`);

  // Strip correct_answer and options from learner view
  const safeAnswers = answers.map(({ correct_answer, option_a, option_b, option_c, option_d, ...rest }) => ({
    ...rest,
  }));

  return {
    submission_id:   submission.submission_id,
    user_id:         user.user_id,
    exercise_id:     exam.exercise_id,
    score:           score ?? null,
    submitted_at:    submission.submitted_at,
    is_passed,
    is_fully_graded: isFullyGraded,
    answers:         safeAnswers as ExamAnswerWithQuestion[],
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

  const submissions = await findAllSubmissionsForExam(exam.exercise_id, exam.passing_score);

  console.log(`[Get Submissions] Retrieved ${submissions.length} submissions for exam #${exam.exercise_id}`);

  return submissions;
};

// ── GET SINGLE SUBMISSION WITH ANSWERS ──────────────────────
export const getExamSubmissionWithAnswersService = async (
  course_id:     number,
  submission_id: number,
  user:          JwtPayload
): Promise<ExamSubmissionForMentor & { answers: ExamAnswerWithQuestion[] }> => {

  await verifyCourseOwnership(course_id, user);

  const exam = await findExamByCourse(course_id);
  if (!exam) throw new NotFoundError('No final exam for this course');

  // Get submission
  const submission = await db('exercise_submissions')
    .join('users', 'exercise_submissions.user_id', 'users.user_id')
    .where({
      'exercise_submissions.submission_id': submission_id,
      'exercise_submissions.exercise_id': exam.exercise_id
    })
    .select(
      'exercise_submissions.*',
      'users.name  as learner_name',
      'users.email as learner_email'
    )
    .first();

  if (!submission) throw new NotFoundError('Submission not found');

  // Get answers with question details
  const answers = await db('exam_answers')
    .join('exam_questions', 'exam_answers.question_id', 'exam_questions.question_id')
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
    .orderBy('exam_questions.question_order');

  // Calculate grading status
  const total   = answers.length;
  const pending = answers.filter((a: any) => a.is_correct === null).length;
  const graded  = total - pending;
  const correct = answers.filter((a: any) => a.is_correct === true || a.is_correct === 1).length;

  const isFullyGraded = pending === 0 && total > 0;
  const score = isFullyGraded && total > 0
    ? Math.round((correct / total) * 100)
    : submission.score;

  const is_passed = score !== null && score !== undefined
    ? score >= exam.passing_score
    : null;

  console.log(`[Get Submission] Retrieved submission #${submission_id}:`);
  console.log(`[Get Submission] Learner: ${submission.learner_name} (${submission.learner_email})`);
  console.log(`[Get Submission] Total Questions: ${total}, Pending Grade: ${pending}`);

  return {
    submission_id:   submission.submission_id,
    user_id:         submission.user_id,
    learner_name:    submission.learner_name,
    learner_email:   submission.learner_email,
    score:           score ?? null,
    submitted_at:    submission.submitted_at,
    is_passed,
    is_fully_graded: isFullyGraded,
    pending_count:   pending,
    answers:         answers,
  };
};

// ── GRADE SHORT ANSWER ────────────────────────────────────────
export const gradeAnswerService = async (
  answer_id:  number,
  body:       GradeAnswerBody,
  user:       JwtPayload
): Promise<GradeAnswerResponse> => {

  const answer = await findAnswer(answer_id);
  if (!answer) throw new NotFoundError('Answer not found');

  // Step 1: Record the grade
  await gradeAnswer(answer_id, body.is_correct, user.user_id);
  console.log(`[Grade Answer] Graded answer #${answer_id}: is_correct=${body.is_correct}`);

  // Step 2: Check if all answers in this submission are now graded
  const allAnswers = await findAnswersBySubmission(answer.submission_id);
  const pendingCount = allAnswers.filter(
    (a) => a.is_correct === null
  ).length;

  console.log(`[Grade Answer] Submission #${answer.submission_id}: ${pendingCount} answers still pending`);

  if (pendingCount > 0) {
    // Still pending — return to mentor
    console.log(`[Grade Answer] Awaiting mentor to grade remaining ${pendingCount} answer(s)`);
    return {
      success:           true,
      message:           'Answer graded successfully',
      submission_status: 'pending',
      overall_score:     null,
      is_passed:         null,
      pending_count:     pendingCount,
    };
  }

  // Step 3: All graded — calculate final score
  console.log(`[Grade Answer] All answers graded! Calculating final score...`);

  const { score, is_passed, passing_score } =
    await calculateAndSaveScore(answer.submission_id);

  console.log(`[Grade Answer - Score] Submission #${answer.submission_id}:`);
  const totalAnswers = allAnswers.length;
  const correctCount = allAnswers.filter((a: any) => a.is_correct === true || a.is_correct === 1).length;
  console.log(`  Correct: ${correctCount}/${totalAnswers}`);
  console.log(`  Score: ${score}%`);
  console.log(`  Passing Score: ${passing_score}%`);
  console.log(`  Is Passed: ${is_passed}`);

  // Step 4: Update enrollment status
  const submission = await db('exercise_submissions')
    .where({ submission_id: answer.submission_id })
    .first();

  if (!submission) throw new NotFoundError('Submission not found');

  const exam = await db('exercises')
    .where({ exercise_id: submission.exercise_id })
    .first();

  if (!exam) throw new NotFoundError('Exam not found');

  // Get enrollment for this learner + course
  const enrollment = await findEnrollmentByUserAndCourse(
    answer.user_id,
    exam.exam_course_id
  );

  if (enrollment) {
    if (is_passed) {
      console.log(`[Grade Answer - Enrollment] PASSED! Updated enrollment to 'completed'. Certificate generated.`);
      await updateEnrollmentStatus(
        enrollment.enrollment_id,
        'completed'
      );
      await generateCertificateService(
        answer.user_id,
        exam.exam_course_id
      );
    } else {
      // Failed — keep exam_pending to allow retaking
      console.log(`[Grade Answer - Enrollment] FAILED! Score ${score}% < ${passing_score}%. Enrollment stays exam_pending.`);
      await updateEnrollmentStatus(
        enrollment.enrollment_id,
        'exam_pending'
      );
    }
  }

  return {
    success:           true,
    message:           'Answer graded successfully',
    submission_status: 'fully_graded',
    overall_score:     score,
    is_passed,
    pending_count:     0,
  };
};