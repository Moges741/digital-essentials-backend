export type ContentType = 'quiz' | 'worksheet' | 'simulation';

export interface Exercise {
  exercise_id:          number;
  lesson_id:            number;
  created_by:           number;
  title:                string;
  content_type:         ContentType;
  file_url:             string | null;
  cloudinary_public_id: string | null;
  is_downloadable:      boolean;
  created_at:           Date;
}
export interface ExerciseWithLesson extends Exercise {
  lesson_title:  string;
  lesson_order:  number;
  course_id:     number;
}

export interface ExerciseSubmission {
  submission_id: number;
  user_id:       number;
  exercise_id:   number;
  score:         number | null;
  submitted_at:  Date;
  is_synced:     boolean;
}

export interface SubmissionWithLearner extends ExerciseSubmission {
  learner_name:  string;
  learner_email: string;
}

export interface CreateExerciseBody {
  title:            string;
  content_type:     ContentType;
  lesson_id:        string;   
  is_downloadable?: string;   
}

export interface SubmitExerciseBody {
  score?: number; 
}