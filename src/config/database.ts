import knex from 'knex';
import { env } from './env';

const db = knex({
  client: 'mysql2',
  connection: {
    host:     env.db.host,
    port:     env.db.port,
    database: env.db.name,
    user:     env.db.user,
    password: env.db.password,
    charset:  'utf8mb4',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: '../../database/migrations',
    extension: 'ts',
  },
});

export default db;
