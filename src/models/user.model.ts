import db from '../config/db';
import bcrypt from 'bcrypt';
// Type definitions for user records
export interface User {
  user_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'learner' | 'mentor' | 'administrator';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  google_id?: string | null;
  email_verified?: boolean;
}

export type SafeUser = Omit<User, 'password_hash'>;

// ─── Find user by email ──────────────
export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  return db('users')
    .where({ email })
    .first();
};

// ─── Find user by ID (full user) ────────────────
export const findUserByIdFull = async (user_id: number): Promise<User | undefined> => {
  return db('users')
    .where({ user_id })
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
// ─── Find user by Google ID ──────────────
export const findUserByGoogleId = async (google_id: string): Promise<User | undefined> => {
  return db('users')
    .where({ google_id })
    .first();
};

// ─── Update user with Google ID ──────────
export const updateUserGoogleId = async (user_id: number, google_id: string): Promise<void> => {
  await db('users')
    .where({ user_id })
    .update({ google_id, updated_at: db.fn.now() });
};
// ─── Check if email exists ────────────
export const emailExists = async (email: string): Promise<boolean> => {
  const result = await db('users')
    .where({ email })
    .count('user_id as count')
    .first();
  return Number(result?.count) > 0;
};
 
export const findUserById = async (user_id: number): Promise<SafeUser | undefined> => {
  const user = await db('users')
    .where({ user_id })
    .first();

  if (!user) return undefined;

  const { password_hash, ...safeUser } = user;
  return safeUser;
};