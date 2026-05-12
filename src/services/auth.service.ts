import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {env} from '../config/env';
// import { sendVerificationEmail } from './email.service';
// import {  createVerificationToken, verifyTokenAndGetUser } from '../models/user.model';
// import crypto from 'crypto';

import {
    emailExists,
    createUser,
    createLearnerProfile,
    createMentorProfile,
    findUserByEmail,
    findUserByIdFull
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
  
export const registerUser = async (body: RegisterBody): Promise<AuthResponse> => {
    const {name, email, password , role, specialization, qualifications} = body;
    if(role === 'mentor' && !specialization) {
        throw new ValidationError('Mentors must provide a specialization');
    }

    const exists = await emailExists(email);
    if(exists){
        throw new ConflictError('An account with this email already exists');
    }


    const password_hash = await bcrypt.hash(password, 10);

    const user_id = await createUser({name, email, password_hash, role});

    if(role === 'learner'){
        await createLearnerProfile(user_id);
    }

    if(role === 'mentor'){
        await createMentorProfile(user_id, specialization!, qualifications);    
    }

    const user = await findUserByIdFull(user_id);
    const token = generateToken(user!);

    return {
        user: user!,
        token
    };
}


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
