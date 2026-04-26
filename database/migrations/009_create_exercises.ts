import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('exercises', (table) => {
    table.increments('exercise_id').unsigned().primary();
    table.integer('lesson_id').unsigned().notNullable();
    table.integer('created_by').unsigned().notNullable();
    table.string('title', 200).notNullable();
    table.enum('content_type', ['quiz', 'worksheet', 'simulation']).notNullable();
    table.string('file_url', 500).nullable();              // Cloudinary URL
    table.string('cloudinary_public_id', 300).nullable();  // for deletion
    table.boolean('is_downloadable').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.foreign('lesson_id')
         .references('lesson_id')
         .inTable('lessons')
         .onDelete('CASCADE');
    table.foreign('created_by')
         .references('user_id')
         .inTable('users')
         .onDelete('RESTRICT');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('exercises');
}