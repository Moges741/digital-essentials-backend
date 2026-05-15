import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { env } from '../config/env';
import { ValidationError } from '../utils/errors';

const hasMailerConfig = (): boolean => {
  return Boolean(
    env.email.smtpHost &&
    env.email.smtpPort &&
    env.email.smtpUser &&
    env.email.smtpPass &&
    env.email.from
  );
};

const createTransporter = () => {
  if (!hasMailerConfig()) {
    throw new ValidationError(
      'Email verification is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.'
    );
  }

  return nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: env.email.smtpPort === 465,
    auth: {
      user: env.email.smtpUser,
      pass: env.email.smtpPass,
    },
  });
};

export const generateVerificationToken = (): { token: string; tokenHash: string } => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
};

export const sendVerificationEmail = async (params: {
  name: string;
  email: string;
  token: string;
}): Promise<void> => {
  const transporter = createTransporter();
  const verificationLink = `${env.email.frontendUrl}/verify-email?token=${encodeURIComponent(params.token)}`;

  await transporter.sendMail({
    from: env.email.from,
    to: params.email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin-bottom: 16px;">Verify your email address</h2>
        <p>Hi ${params.name},</p>
        <p>Thanks for registering. Please verify your email address to activate your account.</p>
        <p style="margin: 24px 0;">
          <a href="${verificationLink}" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Verify Email</a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>This link expires in 30 minutes.</p>
      </div>
    `,
    text: `Hi ${params.name}, verify your email: ${verificationLink}`,
  });
};