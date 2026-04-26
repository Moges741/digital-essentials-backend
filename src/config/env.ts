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
    secret:     process.env.JWT_SECRET as string,
    expiresIn:  '7d',
  },
  app: {
    port:     parseInt(process.env.PORT as string, 10),
    nodeEnv:  process.env.NODE_ENV as string,
  },
};
