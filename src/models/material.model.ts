// src/models/material.model.ts

import db from '../config/db';
import { OfflineMaterial } from '../types/material.types';

// ─── Create material ──────────────────────────────────────────
export const createMaterial = async (data: {
  course_id:            number;
  lesson_id:            number | null;
  title:                string;
  file_url:             string;
  cloudinary_public_id: string;
  file_type:            string;
  is_downloadable:      boolean;
}): Promise<number> => {
  const [material_id] = await db('offline_materials').insert(data);
  return material_id;
};

// ─── Find material by ID ──────────────────────────────────────
export const findMaterialById = async (
  material_id: number
): Promise<OfflineMaterial | undefined> => {
  return db('offline_materials')
    .where({ material_id })
    .first();
};

// ─── List materials for a course ─────────────────────────────
export const listMaterialsByCourse = async (
  course_id: number
): Promise<OfflineMaterial[]> => {
  return db('offline_materials')
    .where({ course_id })
    .orderBy('created_at', 'asc');
};

// ─── List materials for a lesson ─────────────────────────────
export const listMaterialsByLesson = async (
  lesson_id: number
): Promise<OfflineMaterial[]> => {
  return db('offline_materials')
    .where({ lesson_id })
    .orderBy('created_at', 'asc');
};

// ─── Delete material ──────────────────────────────────────────
export const deleteMaterial = async (material_id: number): Promise<void> => {
  await db('offline_materials')
    .where({ material_id })
    .delete();
};