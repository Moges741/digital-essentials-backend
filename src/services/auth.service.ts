import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {env} from '../config/env';
import { generateVerificationToken, sendVerificationEmail, sendPasswordResetEmail } from './email.service';
import { ForbiddenError } from '../utils/errors';

import {
    emailExists,
    createUser,
    createLearnerProfile,
    createMentorProfile,
    findUserByEmail,
    findUserById,
  updateUserVerificationToken,
  findUserByVerificationTokenHash,
  clearUserVerificationToken,
  updateUserPasswordResetToken,
  findUserByPasswordResetTokenHash,
  updateUserPassword,
  clearPasswordResetToken,
} from '../models/user.model';


import {
    RegisterBody,
    LoginBody,
    AuthResponse,
    JwtPayload,
    SafeUser
} from '../types/auth.types';

import {
    ConflictError,
    ValidationError,
    UnauthorizedError,
    NotFoundError
} from '../utils/errors';

// REGISTER
export const generateToken = (user: SafeUser): string => {
  const payload: JwtPayload = {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
};
  
export const registerUser = async (body: RegisterBody): Promise<{ user: SafeUser }> => {
    const {name, email, password , role, specialization, qualifications} = body;
    if(role === 'mentor' && !specialization) {
        throw new ValidationError('Mentors must provide a specialization');
    }

    const exists = await emailExists(email);
    if(exists){
        throw new ConflictError('An account with this email already exists');
    }


    const password_hash = await bcrypt.hash(password, 10);
    const { token, tokenHash } = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const user_id = await createUser({name, email, password_hash, role, email_verified: false});

    if(role === 'learner'){
        await createLearnerProfile(user_id);
    }

    if(role === 'mentor'){
        await createMentorProfile(user_id, specialization!, qualifications);    
    }

    await updateUserVerificationToken(user_id, tokenHash, expiresAt);

    const userForEmail = await findUserById(user_id);
    if (!userForEmail) {
        throw new NotFoundError('User not found after registration');
    }

    await sendVerificationEmail({
      name: userForEmail.name,
      email: userForEmail.email,
      token,
    });

    return {
        user: userForEmail,
    };
}

export const verifyEmailAddress = async (token: string): Promise<AuthResponse> => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await findUserByVerificationTokenHash(tokenHash);

  if (!user) {
    throw new ValidationError('Verification link is invalid or has expired');
  }

  await clearUserVerificationToken(user.user_id);

  const verifiedUser = await findUserById(user.user_id);
  if (!verifiedUser) {
    throw new NotFoundError('User not found');
  }

  return {
    user: verifiedUser,
    token: generateToken(verifiedUser),
  };
};

export const resendVerificationEmail = async (email: string): Promise<void> => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.email_verified) {
    throw new ValidationError('This email is already verified');
  }

  const { token, tokenHash } = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await updateUserVerificationToken(user.user_id, tokenHash, expiresAt);
  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    token,
  });
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await findUserByEmail(email);
  if (!user) throw new NotFoundError('User not found');
  if (!user.is_active) throw new ValidationError('Account is deactivated');

  const { token, tokenHash } = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await updateUserPasswordResetToken(user.user_id, tokenHash, expiresAt);
  await sendPasswordResetEmail({ name: user.name, email: user.email, token });
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await findUserByPasswordResetTokenHash(tokenHash);
  if (!user) throw new ValidationError('Reset token is invalid or has expired');

  const password_hash = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(user.user_id, password_hash);
  await clearPasswordResetToken(user.user_id);
};


// ─── LOGIN ─────
export const loginUser = async (body: LoginBody): Promise<AuthResponse> => {

  const { email, password } = body;

  const user = await findUserByEmail(email);

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.is_active) {
    throw new UnauthorizedError('Your account has been deactivated');
  }

  if (!user.email_verified) {
    throw new ForbiddenError('Please verify your email before logging in');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateToken(user);

  const safeUser: SafeUser = {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  return { user: safeUser, token };
};
