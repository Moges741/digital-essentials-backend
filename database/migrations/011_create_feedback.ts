import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('feedback', (table) => {
    table.increments('feedback_id').unsigned().primary();
    table.integer('enrollment_id').unsigned().notNullable().unique();
    table.tinyint('rating').unsigned().notNullable();      // 1-5 from your ERD
    table.text('comments').nullable();
    table.timestamp('submitted_at').notNullable().defaultTo(knex.fn.now());
    table.foreign('enrollment_id')
         .references('enrollment_id')
         .inTable('enrollments')
         .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('feedback');
}