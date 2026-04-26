import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('lessons', (table) => {
    table.increments('lesson_id').unsigned().primary();
    table.integer('course_id').unsigned().notNullable();
    table.string('title', 200).notNullable();
    table.text('content').nullable();
    table.smallint('lesson_order').unsigned().notNullable().defaultTo(1);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.foreign('course_id')
         .references('course_id')
         .inTable('courses')
         .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('lessons');
}
