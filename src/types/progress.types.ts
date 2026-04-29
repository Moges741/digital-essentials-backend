export interface Progress {
  progress_id:   number;
  user_id:       number;
  lesson_id:     number;
  enrollment_id: number;
  is_completed:  boolean;
  last_accessed: Date;
  synced_at:     Date | null;
}

// Progress with lesson details joined
export interface ProgressWithLesson extends Progress {
  lesson_title: string;
  lesson_order: number;
}

// Full course progress summary
export interface CourseProgressSummary {
  enrollment_id:     number;
  course_id:         number;
  course_title:      string;
  status:            string;
  total_lessons:     number;
  completed_lessons: number;
  percentage:        number;
  lessons:           ProgressWithLesson[];
}

// Single item in offline sync batch
export interface OfflineSyncItem {
  lesson_id:    number;
  completed_at: string;  
}

// Request body for offline sync
export interface SyncProgressBody {
  completions: OfflineSyncItem[];
}

// Result of sync operation
export interface SyncResult {
  synced: number[];   
  failed: {
    lesson_id: number;
    reason:    string;
  }[];
}



