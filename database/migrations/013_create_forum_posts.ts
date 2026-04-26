import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('forum_posts', (table) => {
    table.increments('post_id').unsigned().primary();
    table.integer('course_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.integer('parent_id').unsigned().nullable(); // NULL = top post, set = reply
    table.text('content').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.foreign('course_id')
         .references('course_id')
         .inTable('courses')
         .onDelete('CASCADE');
    table.foreign('user_id')
         .references('user_id')
         .inTable('users')
         .onDelete('CASCADE');
    table.foreign('parent_id')
         .references('post_id')
         .inTable('forum_posts')
         .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('forum_posts');
}