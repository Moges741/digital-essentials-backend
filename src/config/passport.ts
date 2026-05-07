import passport from 'passport';
// Use require and cast to any to avoid missing type declaration for the
// 'passport-google-oauth20' package in this project.
const GoogleStrategy = require('passport-google-oauth20').Strategy as any;
import { handleGoogleAuth } from '../services/google-auth.service';
import { env } from './env';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.google.clientId,
      clientSecret: env.google.clientSecret,
      callbackURL: env.google.redirectUrl,
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const result = await handleGoogleAuth(profile);
        done(null, result);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});