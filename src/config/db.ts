import knex from 'knex';
import config from './database';

const db = knex(config);

export default db;