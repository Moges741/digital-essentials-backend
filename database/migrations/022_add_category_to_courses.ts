import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('courses', (table) => {
    table.enum('category', ['Basics', 'Intermediate', 'Advanced']).notNullable().defaultTo('Basics');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('courses', (table) => {
    table.dropColumn('category');
  });
}
