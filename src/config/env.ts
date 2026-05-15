import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'PORT',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  db: {
    host:     process.env.DB_HOST as string,
    port:     parseInt(process.env.DB_PORT as string, 10),
    name:     process.env.DB_NAME as string,
    user:     process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
  },
  jwt: {
    secret:    process.env.JWT_SECRET as string,
    expiresIn: '7d',
  },
  app: {
    port:    parseInt(process.env.PORT as string, 10),
    nodeEnv: process.env.NODE_ENV as string,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    apiKey:    process.env.CLOUDINARY_API_KEY as string,
    apiSecret: process.env.CLOUDINARY_API_SECRET as string,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUrl: process.env.GOOGLE_REDIRECT_URL!,
  },
  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
  },
};