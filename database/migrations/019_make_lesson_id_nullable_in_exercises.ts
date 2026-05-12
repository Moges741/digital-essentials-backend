import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('exercises', (table) => {
    // Drop the existing foreign key constraint
    table.dropForeign(['lesson_id']);
    // Make lesson_id nullable
    table.integer('lesson_id').unsigned().nullable().alter();
    // Re-add the foreign key constraint allowing NULL
    table.foreign('lesson_id')
         .references('lesson_id')
         .inTable('lessons')
         .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('exercises', (table) => {
    // Drop the foreign key
    table.dropForeign(['lesson_id']);
    // Make lesson_id not nullable again
    table.integer('lesson_id').unsigned().notNullable().alter();
    // Re-add the foreign key
    table.foreign('lesson_id')
         .references('lesson_id')
         .inTable('lessons')
         .onDelete('CASCADE');
  });
}