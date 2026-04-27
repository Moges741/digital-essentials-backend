import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {env} from '../config/env';

import {
    emailExists,
    createUser,
    createLearnerProfile,
    createMentorProfile,
    findUserByEmail,
    findUserById
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
    UnauthorizedError
} from '../utils/errors';

// REGISTER

export const registerUser = async (body: RegisterBody): Promise<SafeUser> => {
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

    const user = await findUserById(user_id);

    return user!;

}
