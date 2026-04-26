import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('mentor_profiles', (table) => {
    table.increments('profile_id').unsigned().primary();
    table.integer('user_id').unsigned().notNullable().unique();
    table.string('specialization', 200).notNullable();
    table.text('qualifications').nullable();
    table.foreign('user_id')
         .references('user_id')
         .inTable('users')
         .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('mentor_profiles');
}
