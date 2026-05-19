import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('mentor_applications', (table) => {
    table.increments('id').unsigned().primary();
    table.string('name', 100).notNullable();
    table.string('email', 150).notNullable().unique();
    table.string('phone_number', 20).notNullable();
    table.string('academic_file_url', 500).notNullable();
    table.string('national_id_url', 500).notNullable();
    table.string('linkedin_link', 255).nullable();
    table.string('github_link', 255).nullable();
    table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('mentor_applications');
}
