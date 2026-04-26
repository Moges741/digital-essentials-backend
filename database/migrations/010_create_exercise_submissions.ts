import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('exercise_submissions', (table) => {
    table.increments('submission_id').unsigned().primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('exercise_id').unsigned().notNullable();
    table.decimal('score', 5, 2).nullable();
    table.timestamp('submitted_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('is_synced').notNullable().defaultTo(false); // offline sync flag
    table.foreign('user_id')
         .references('user_id')
         .inTable('users')
         .onDelete('CASCADE');
    table.foreign('exercise_id')
         .references('exercise_id')
         .inTable('exercises')
         .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('exercise_submissions');
}