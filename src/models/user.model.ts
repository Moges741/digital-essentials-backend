import db from '../config/db';
import { User, SafeUser } from '../types/auth.types';

// ─── Find user by email ──────────────
export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  return db('users')
    .where({ email })
    .first();
};

// ─── Find user by ID ────────────────
export const findUserById = async (user_id: number): Promise<SafeUser | undefined> => {
  return db('users')
    .where({ user_id })
    .select(
      'user_id',
      'name',
      'email',
      'role',
      'is_active',
      'created_at',
      'updated_at'
    )
    .first();
};

// ─── Create user ───────────────────
export const createUser = async (userData: {
  name: string;
  email: string;
  password_hash: string;
  role: 'learner' | 'mentor' | 'administrator';
}): Promise<number> => {
  const [user_id] = await db('users').insert(userData);
  return user_id;
};

// ─── Create learner profile ──────────────
export const createLearnerProfile = async (user_id: number): Promise<void> => {
  await db('learner_profiles').insert({
    user_id,
    skill_level: 'beginner', 
  });
};

// ─── Create mentor profile ─────────────
export const createMentorProfile = async (
  user_id: number,
  specialization: string,
  qualifications?: string
): Promise<void> => {
  await db('mentor_profiles').insert({
    user_id,
    specialization,
    qualifications: qualifications ?? null,
  });
};

// ─── Check if email exists ────────────
export const emailExists = async (email: string): Promise<boolean> => {
  const result = await db('users')
    .where({ email })
    .count('user_id as count')
    .first();
  return Number(result?.count) > 0;
};