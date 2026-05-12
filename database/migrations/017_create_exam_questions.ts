
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('exam_questions', (table) => {
    table.increments('question_id').unsigned().primary();
    table.integer('exercise_id').unsigned().notNullable();
    table.text('question_text').notNullable();
    table.enum('question_type', ['multiple_choice', 'short_answer'])
         .notNullable();
    // Multiple choice options — null for short answer
    table.string('option_a', 500).nullable();
    table.string('option_b', 500).nullable();
    table.string('option_c', 500).nullable();
    table.string('option_d', 500).nullable();
    // Stored as 'A', 'B', 'C', or 'D' for MC — null for short answer
    table.string('correct_answer', 10).nullable();
    table.smallint('question_order').unsigned().notNullable().defaultTo(1);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.foreign('exercise_id')
         .references('exercise_id')
         .inTable('exercises')
         .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('exam_questions');
}