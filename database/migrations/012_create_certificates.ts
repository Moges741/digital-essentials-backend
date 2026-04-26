import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('certificates', (table) => {
    table.increments('certificate_id').unsigned().primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('course_id').unsigned().notNullable();
    table.timestamp('issued_at').notNullable().defaultTo(knex.fn.now());
    table.string('certificate_url', 500).nullable();  // Cloudinary URL
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
  await knex.schema.dropTableIfExists('certificates');
}