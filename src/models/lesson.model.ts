// src/models/lesson.model.ts

import db from '../config/db';
import {
  Lesson,
  LessonWithMaterials,
  CreateLessonBody,
  UpdateLessonBody,
} from '../types/lesson.types';

// ─── Create a lesson ───────────
export const createLesson = async (
  course_id: number,
  data: CreateLessonBody
): Promise<number> => {

  // If no lesson_order provided, auto-assign next order number
  // This prevents gaps and makes ordering predictable
  let lesson_order = data.lesson_order;

  if (!lesson_order) {
    const result = await db('lessons')
      .where({ course_id })
      .max('lesson_order as max_order')
      .first();
    lesson_order = (Number(result?.max_order) || 0) + 1;
  }

  const [lesson_id] = await db('lessons').insert({
    course_id,
    title:        data.title,
    content:      data.content ?? null,
    lesson_order,
  });

  return lesson_id;
};

// ─── Find lesson by ID ──────────────
export const findLessonById = async (
  lesson_id: number
): Promise<Lesson | undefined> => {
  return db('lessons')
    .where({ lesson_id })
    .first();
};

// ─── Find lesson with materials ───────────────
// Returns lesson + all its offline materials
// Used for the single lesson detail view
export const findLessonWithMaterials = async (
  lesson_id: number
): Promise<LessonWithMaterials | undefined> => {

  const lesson = await findLessonById(lesson_id);
  if (!lesson) return undefined;

  const materials = await db('offline_materials')
    .where({ lesson_id })
    .select(
      'material_id',
      'title',
      'file_url',
      'file_type',
      'is_downloadable'
    )
    .orderBy('created_at', 'asc');

  return { ...lesson, materials };
};

// ─── List all lessons for a course ───────────
export const listLessonsByCourse = async (
  course_id: number
): Promise<Lesson[]> => {
  return db('lessons')
    .where({ course_id })
    .orderBy('lesson_order', 'asc');
};

// ─── Update lesson ───────────────────────────
export const updateLesson = async (
  lesson_id: number,
  data: UpdateLessonBody
): Promise<void> => {
  await db('lessons')
    .where({ lesson_id })
    .update(data);
};

// ─── Delete lesson ──────────────────────────
export const deleteLesson = async (lesson_id: number): Promise<void> => {
  await db('lessons')
    .where({ lesson_id })
    .delete();
};

// ─── Check lesson belongs to course ──────────────────────────
// Safety check — prevents accessing lesson from wrong course
export const lessonBelongsToCourse = async (
  lesson_id: number,
  course_id: number
): Promise<boolean> => {
  const result = await db('lessons')
    .where({ lesson_id, course_id })
    .count('lesson_id as count')
    .first();
  return Number(result?.count) > 0;
};