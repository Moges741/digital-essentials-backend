import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('offline_materials', (table) => {
    table.increments('material_id').unsigned().primary();
    table.integer('course_id').unsigned().notNullable();
    table.integer('lesson_id').unsigned().nullable();
    table.string('title', 200).notNullable();
    table.string('file_url', 500).notNullable();        // Cloudinary URL
    table.string('cloudinary_public_id', 300).notNullable(); // needed for deletion
    table.enum('file_type', ['pdf', 'audio', 'video', 'worksheet']).notNullable();
    table.boolean('is_downloadable').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.foreign('course_id')
         .references('course_id')
         .inTable('courses')
         .onDelete('CASCADE');
    table.foreign('lesson_id')
         .references('lesson_id')
         .inTable('lessons')
         .onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('offline_materials');
}
