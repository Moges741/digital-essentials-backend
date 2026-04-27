
export interface Course {
  course_id: number;
  title: string;
  description: string;
  duration_mins: number;
  created_by: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CourseWithCreator extends Course {
  creator_name: string;
  creator_role: string;
}

export interface CourseWithLessons extends CourseWithCreator {
  lessons: {
    lesson_id: number;
    title: string;
    lesson_order: number;
  }[];
}

export interface CreateCourseBody {
  title: string;
  description: string;
  duration_mins?: number;
}

export interface UpdateCourseBody {
  title?: string;
  description?: string;
  duration_mins?: number;
}

export interface CourseQueryParams {
  page?: string;
  limit?: string;
  search?: string;
}

export interface PaginatedCourses {
  courses: CourseWithCreator[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}