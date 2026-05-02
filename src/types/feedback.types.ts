export interface Feedback {
  feedback_id:   number;
  enrollment_id: number;
  rating:        number;
  comments:      string | null;
  submitted_at:  Date;
}

export interface FeedbackWithDetails extends Feedback {
  course_title: string;
  user_name:    string;
  user_email:   string;
}

export interface CreateFeedbackBody {
  rating:   number;
  comments?: string;
}

export interface UpdateFeedbackBody {
  rating?:   number;
  comments?: string;
}