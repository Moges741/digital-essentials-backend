import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('email_verified').notNullable().defaultTo(false);
    table.string('email_verification_token_hash', 255).nullable();
    table.timestamp('email_verification_expires_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email_verification_expires_at');
    table.dropColumn('email_verification_token_hash');
    table.dropColumn('email_verified');
  });
}