import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('courses', (table) => {
    table.increments('course_id').unsigned().primary();
    table.string('title', 200).notNullable();
    table.text('description').notNullable();
    table.integer('duration_mins').unsigned().notNullable().defaultTo(0);
    table.integer('created_by').unsigned().notNullable();
    table.boolean('is_published').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.foreign('created_by')
         .references('user_id')
         .inTable('users')
         .onDelete('RESTRICT');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('courses');
}
