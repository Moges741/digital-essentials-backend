import path from 'path';
import dotenv from 'dotenv';
import { Knex } from 'knex';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const config: Knex.Config = {
  client: 'mysql2',
  connection: {
    host:     process.env.DB_HOST as string,
    port:     parseInt(process.env.DB_PORT as string, 10),
    database: process.env.DB_NAME as string,
    user:     process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    charset:  'utf8mb4',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: path.resolve(__dirname, '../../database/migrations'),
    extension: 'ts',
  },
};

export default config;