import { User } from '../types/auth.types';
import { findUserByEmail, findUserByGoogleId, createUser, createLearnerProfile, updateUserGoogleId } from '../models/user.model';
import { generateToken } from './auth.service';  // We'll reuse JWT generation

export const handleGoogleAuth = async (googleProfile: any): Promise<{ user: User; token: string; isNewUser: boolean }> => {
  const { id: google_id, displayName: name, emails } = googleProfile;
  const email = emails[0].value;

  // Check if user exists by Google ID
  let user = await findUserByGoogleId(google_id);
  let isNewUser = false;

  if (user) {
    // Existing Google user
    return { user, token: generateToken(user), isNewUser: false };
  }

  // Check if user exists by email (account linking)
  user = await findUserByEmail(email);
  if (user) {
    if (user.google_id) {
      throw new Error('Account already linked to another Google account');
    }
    // Link existing account
    await updateUserGoogleId(user.user_id, google_id);
    return { user: { ...user, google_id }, token: generateToken(user), isNewUser: false };
  }

  // New user: create account
  const password_hash = '';  // No password for Google users
  const user_id = await createUser({ name, email, password_hash, role: 'learner' });
  await createLearnerProfile(user_id);
  await updateUserGoogleId(user_id, google_id);

  user = await findUserByGoogleId(google_id);
  isNewUser = true;

  return { user: user!, token: generateToken(user!), isNewUser };
};