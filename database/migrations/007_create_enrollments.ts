import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('enrollments', (table) => {
    table.increments('enrollment_id').unsigned().primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('course_id').unsigned().notNullable();
    table.date('enrollment_date').notNullable().defaultTo(knex.fn.now());
    table.enum('status', ['active', 'completed', 'dropped'])
         .notNullable()
         .defaultTo('active');
    table.unique(['user_id', 'course_id']);
    table.foreign('user_id')
         .references('user_id')
         .inTable('users')
         .onDelete('CASCADE');
    table.foreign('course_id')
         .references('course_id')
         .inTable('courses')
         .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('enrollments');
}