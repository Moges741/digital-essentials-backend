import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('progress', (table) => {
    table.increments('progress_id').unsigned().primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('lesson_id').unsigned().notNullable();
    table.integer('enrollment_id').unsigned().notNullable();
    table.boolean('is_completed').notNullable().defaultTo(false);
    table.timestamp('last_accessed').notNullable().defaultTo(knex.fn.now());
    table.timestamp('synced_at').nullable();  // NULL = not yet synced (offline scenario)
    table.unique(['user_id', 'lesson_id']);
    table.foreign('user_id')
         .references('user_id')
         .inTable('users')
         .onDelete('CASCADE');
    table.foreign('lesson_id')
         .references('lesson_id')
         .inTable('lessons')
         .onDelete('CASCADE');
    table.foreign('enrollment_id')
         .references('enrollment_id')
         .inTable('enrollments')
         .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('progress');
}