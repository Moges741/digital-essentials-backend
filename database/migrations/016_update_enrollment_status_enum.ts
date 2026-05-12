
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE enrollments
    MODIFY COLUMN status
    ENUM('active', 'exam_pending', 'completed', 'dropped')
    NOT NULL
    DEFAULT 'active'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE enrollments
    MODIFY COLUMN status
    ENUM('active', 'completed', 'dropped')
    NOT NULL
    DEFAULT 'active'
  `);
}