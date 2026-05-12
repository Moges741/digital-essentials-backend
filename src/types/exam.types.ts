
export type QuestionType = 'multiple_choice' | 'short_answer';

// The exam itself (stored in exercises table with is_final_exam = true)
export interface FinalExam {
  exercise_id:    number;
  exam_course_id: number;
  title:          string;
  passing_score:  number;
  is_final_exam:  boolean;
  created_by:     number;
  created_at:     string;
}

// One question inside the exam
export interface ExamQuestion {
  question_id:    number;
  exercise_id:    number;
  question_text:  string;
  question_type:  QuestionType;
  option_a:       string | null;
  option_b:       string | null;
  option_c:       string | null;
  option_d:       string | null;
  correct_answer: string | null;  // never sent to learner
  question_order: number;
  created_at:     string;
}

// Question sent to learner — correct_answer removed
export type ExamQuestionForLearner = Omit<ExamQuestion, 'correct_answer'>;

// Exam with questions — full mentor view
export interface ExamWithQuestions extends FinalExam {
  questions: ExamQuestion[];
}

// Exam with questions — learner view (no correct answers)
export interface ExamForLearner extends FinalExam {
  questions: ExamQuestionForLearner[];
}

// One answer in a learner's submission
export interface ExamAnswer {
  answer_id:     number;
  submission_id: number;
  question_id:   number;
  user_id:       number;
  answer_text:   string;
  is_correct:    boolean | null;
  graded_by:     number | null;
  graded_at:     string | null;
  created_at:    string;
}

// Answer with question details for review
export interface ExamAnswerWithQuestion extends ExamAnswer {
  question_text:  string;
  question_type:  QuestionType;
  correct_answer: string | null;
  option_a:       string | null;
  option_b:       string | null;
  option_c:       string | null;
  option_d:       string | null;
}

// Full submission result for a learner
export interface ExamResult {
  submission_id:    number;
  user_id:          number;
  exercise_id:      number;
  score:            number | null;
  submitted_at:     string;
  is_passed:        boolean;
  is_fully_graded:  boolean;   // all short answers reviewed
  answers:          ExamAnswerWithQuestion[];
}

// Submission with learner info for mentor review
export interface ExamSubmissionForMentor {
  submission_id:   number;
  user_id:         number;
  learner_name:    string;
  learner_email:   string;
  score:           number | null;
  submitted_at:    string;
  is_passed:       boolean;
  is_fully_graded: boolean;
  pending_count:   number;  // short answers not yet graded
}

// Request body — create exam
export interface CreateExamBody {
  title:         string;
  passing_score?: number;
}

// Request body — add question
export interface CreateQuestionBody {
  question_text:  string;
  question_type:  QuestionType;
  option_a?:      string;
  option_b?:      string;
  option_c?:      string;
  option_d?:      string;
  correct_answer?: string;
  question_order?: number;
}

// Request body — learner submits exam
export interface SubmitExamBody {
  answers: {
    question_id:  number;
    answer_text:  string;
  }[];
}

// Request body — mentor grades one short answer
export interface GradeAnswerBody {
  is_correct: boolean;
}