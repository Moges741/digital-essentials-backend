import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('exam_answers', (table) => {
    table.increments('answer_id').unsigned().primary();
    table.integer('submission_id').unsigned().notNullable();
    table.integer('question_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.text('answer_text').notNullable();
    // NULL = not graded yet (short answer pending)
    // TRUE/FALSE = graded
    table.boolean('is_correct').nullable().defaultTo(null);
    table.integer('graded_by').unsigned().nullable();
    table.timestamp('graded_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    // One answer per question per submission
    table.unique(['submission_id', 'question_id']);
    table.foreign('submission_id')
         .references('submission_id')
         .inTable('exercise_submissions')
         .onDelete('CASCADE');
    table.foreign('question_id')
         .references('question_id')
         .inTable('exam_questions')
         .onDelete('CASCADE');
    table.foreign('user_id')
         .references('user_id')
         .inTable('users')
         .onDelete('CASCADE');
    table.foreign('graded_by')
         .references('user_id')
         .inTable('users')
         .onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('exam_answers');
}