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
  email_verified?: boolean;
  email_verification_token_hash?: string | null;
  email_verification_expires_at?: Date | string | null;
  created_at: Date;
  updated_at: Date;
  google_id?: string | null;
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
  email_verified?: boolean;
}): Promise<number> => {
  const [user_id] = await db('users').insert(userData);
  return user_id;
};

export const updateUserVerificationToken = async (
  user_id: number,
  tokenHash: string,
  expiresAt: Date
): Promise<void> => {
  await db('users')
    .where({ user_id })
    .update({
      email_verification_token_hash: tokenHash,
      email_verification_expires_at: expiresAt,
      updated_at: db.fn.now(),
    });
};

export const clearUserVerificationToken = async (user_id: number): Promise<void> => {
  await db('users')
    .where({ user_id })
    .update({
      email_verified: true,
      email_verification_token_hash: null,
      email_verification_expires_at: null,
      updated_at: db.fn.now(),
    });
};

export const findUserByVerificationTokenHash = async (
  tokenHash: string
): Promise<User | undefined> => {
  return db('users')
    .where({ email_verification_token_hash: tokenHash })
    .andWhere('email_verification_expires_at', '>', db.fn.now())
    .first();
};

export const updateUserPasswordResetToken = async (
  user_id: number,
  tokenHash: string,
  expiresAt: Date
): Promise<void> => {
  await db('users')
    .where({ user_id })
    .update({
      password_reset_token_hash: tokenHash,
      password_reset_expires_at: expiresAt,
      updated_at: db.fn.now(),
    });
};

export const findUserByPasswordResetTokenHash = async (
  tokenHash: string
): Promise<User | undefined> => {
  return db('users')
    .where({ password_reset_token_hash: tokenHash })
    .andWhere('password_reset_expires_at', '>', db.fn.now())
    .first();
};

export const updateUserPassword = async (user_id: number, password_hash: string): Promise<void> => {
  await db('users')
    .where({ user_id })
    .update({ password_hash, updated_at: db.fn.now() });
};

export const clearPasswordResetToken = async (user_id: number): Promise<void> => {
  await db('users')
    .where({ user_id })
    .update({ password_reset_token_hash: null, password_reset_expires_at: null, updated_at: db.fn.now() });
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