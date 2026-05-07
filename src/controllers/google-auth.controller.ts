import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { handleGoogleAuth } from '../services/google-auth.service';
import { sendSuccess, sendError } from '../utils/response';

// ─── Initiate Google OAuth ──────────────────────────────
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

// ─── Google OAuth Callback ──────────────────────────────
export const googleAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user, token, isNewUser } = req.user as any;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback?token=${token}&new=${isNewUser}`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
  }
};